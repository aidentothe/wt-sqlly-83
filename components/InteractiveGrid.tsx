import React, { useRef, useMemo } from 'react';
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
  const mousePosition = useSimpleMousePosition(); // Get normalized mouse coords
  const { size } = useThree(); // To set uResolution

  // Animation state for highlight intensity
  const targetIntensity = useRef(0); // Target intensity when mouse is over a new cell
  const currentIntensity = useRef(0); // Current animated intensity

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMouse.value.set(mousePosition.x, mousePosition.y);
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);

      // Simple proximity check for highlight (placeholder for actual cell detection)
      // This logic should be more refined to trigger based on cell changes
      // For now, just a basic effect if mouse moves significantly
      const dist = Math.sqrt(mousePosition.x*mousePosition.x + mousePosition.y*mousePosition.y);
      // This is a placeholder to trigger fade in/out
      // A better approach would be to detect when the highlighted cell *changes*
      // For simplicity, let's just make it always try to reach 1 if mouse is not at 0,0
      targetIntensity.current = (mousePosition.x !== 0 || mousePosition.y !== 0) ? 1.0 : 0.0;

      // Lerp currentIntensity towards targetIntensity for fade effect
      currentIntensity.current = THREE.MathUtils.lerp(currentIntensity.current, targetIntensity.current, delta * 5.0); // Adjust 5.0 for speed
      materialRef.current.uniforms.uHighlightIntensity.value = currentIntensity.current;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} > {/* Rotate plane to be horizontal */}
      <planeGeometry args={[10, 10, 50, 50]} /> {/* Adjust size and segments */}
      {/* @ts-ignore TS doesn't know about GridMaterial from extend */}
      <gridMaterial ref={materialRef} side={THREE.DoubleSide} />
    </mesh>
  );
} 