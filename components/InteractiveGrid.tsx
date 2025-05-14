import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useSimpleMousePosition } from '@/hooks/useSimpleMousePosition'; // Corrected path

// Define the shader material using drei/shaderMaterial
const GridMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uResolution: new THREE.Vector2(1, 1), // Placeholder, will be set by canvas size
    uHighlightIntensity: 0.0, // Will be animated for fade
    uGridColor: new THREE.Color(0.1, 0.1, 0.2), // Dark blue/purple grid
    uHighlightColor: new THREE.Color(0.5, 1.0, 1.0), // Cyan highlight
  },
  // Vertex Shader (GLSL)
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader (GLSL)
  `
    uniform float uTime;
    uniform vec2 uMouse; // Normalized mouse coords (-0.5 to 0.5)
    uniform vec2 uResolution;
    uniform float uHighlightIntensity;
    uniform vec3 uGridColor;
    uniform vec3 uHighlightColor;
    varying vec2 vUv;

    float drawGrid(vec2 uv, float lineThickness) {
      vec2 gridUv = fract(uv * 10.0); // 10x10 grid lines
      float lineX = smoothstep(lineThickness, lineThickness + 0.01, abs(gridUv.x - 0.5));
      float lineY = smoothstep(lineThickness, lineThickness + 0.01, abs(gridUv.y - 0.5));
      // Invert lines (lines are 0, cells are 1)
      // For thinner lines, make them less dark, so invert to make them darker
      // Simplified: make lines by checking if we are close to an integer multiple
      float lines = ( (gridUv.x > (0.5 - lineThickness*0.5) && gridUv.x < (0.5 + lineThickness*0.5)) || 
                      (gridUv.y > (0.5 - lineThickness*0.5) && gridUv.y < (0.5 + lineThickness*0.5)) ) ? 0.2 : 0.0;
      
      // More robust grid line drawing (anti-aliased)
      vec2 grid = abs(fract(uv * 10.0 - 0.5) - 0.5) / fwidth(uv * 10.0);
      float line = min(grid.x, grid.y);
      return 1.0 - min(line, 1.0); // Inverted: lines are dark
    }

    void main() {
      vec2 centeredUv = vUv - 0.5; // UVs from -0.5 to 0.5, matching mouse
      float baseGrid = drawGrid(vUv, 0.05);
      vec3 color = uGridColor + baseGrid * 0.05; // Base grid color with subtle lines

      // Determine which 2x2 cell block the mouse is over
      // Grid has 10 cells, mouse is -0.5 to 0.5. Scale mouse to 0 to 10.
      vec2 mouseCellCoord = floor((uMouse + 0.5) * 10.0);
      vec2 currentCellCoord = floor(vUv * 10.0);

      float highlight = 0.0;
      // Check if current cell is one of the 2x2 block around mouseCellCoord
      if (currentCellCoord.x >= mouseCellCoord.x && currentCellCoord.x < mouseCellCoord.x + 2.0 &&
          currentCellCoord.y >= mouseCellCoord.y && currentCellCoord.y < mouseCellCoord.y + 2.0) {
        highlight = 1.0;
      }
      
      // Add highlight color mixed with intensity
      color = mix(color, uHighlightColor, highlight * uHighlightIntensity);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ GridMaterial });

export function InteractiveGrid() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const mousePosition = useSimpleMousePosition();
  const { size, gl } = useThree(); // Added gl to potentially attach mouseleave to canvas

  const currentIntensity = useRef(0.0);
  const lastActiveCell = useRef<[number, number] | null>(null);
  const interactionTimeout = useRef<NodeJS.Timeout | null>(null);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uMouse.value.set(mousePosition.x, mousePosition.y);
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);

    // Determine current 2x2 cell block the mouse is over
    const mouseCellX = Math.floor((mousePosition.x + 0.5) * 10.0);
    const mouseCellY = Math.floor((mousePosition.y + 0.5) * 10.0);
    const currentCellKey: [number, number] = [mouseCellX, mouseCellY];

    let targetIntensity = 0.0;

    if (lastActiveCell.current === null || 
        lastActiveCell.current[0] !== currentCellKey[0] || 
        lastActiveCell.current[1] !== currentCellKey[1]) {
      // Mouse moved to a new cell block, or first interaction
      targetIntensity = 1.0;
      lastActiveCell.current = currentCellKey;
      
      // Clear any existing fade-out timeout
      if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
      
      // Set a timeout to start fading out if mouse stays inactive in this new cell
      interactionTimeout.current = setTimeout(() => {
        lastActiveCell.current = null; // Force fade out if mouse is idle
      }, 750); // ms of inactivity before fade out begins
    } else {
      // Mouse is still in the same cell block, keep intensity or let it fade if timeout triggered
      if (lastActiveCell.current !== null) {
        targetIntensity = 1.0; // Keep it lit if timeout hasn't cleared lastActiveCell
      }
    }
    
    currentIntensity.current = THREE.MathUtils.lerp(currentIntensity.current, targetIntensity, delta * 7.0); // Faster fade
    materialRef.current.uniforms.uHighlightIntensity.value = currentIntensity.current;
  });
  
  // Optional: Add mouseleave event on canvas to force fade out
  useEffect(() => {
    const canvas = gl.domElement;
    const handleMouseLeave = () => {
      lastActiveCell.current = null; // Trigger fade out
      if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
    };
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => canvas.removeEventListener('mouseleave', handleMouseLeave);
  }, [gl]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} >
      <planeGeometry args={[10, 10, 50, 50]} />
      {/* @ts-ignore */}
      <gridMaterial ref={materialRef} side={THREE.DoubleSide} />
    </mesh>
  );
} 