"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// GLSL Shaders for the background
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  // Simple noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Value noise
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv * 10.0; // Scale the grid
    float n = noise(uv + uTime * 0.1); // Animate noise
    float dotGrid = smoothstep(0.45, 0.5, n); // Create dots
    // Make dots less visible
    vec3 color = vec3(dotGrid * 0.3); // Adjust 0.3 to make dots more/less subtle
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Floating Shape Component
function FloatingShape(props: ThreeElements['mesh'] & { geometryType?: 'sphere' | 'torus' | 'roundedBox', color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [initialRotation] = React.useState(() => new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));
  const [rotationSpeed] = React.useState(() => (Math.random() - 0.5) * 0.02);
  const [floatSpeed] = React.useState(() => (Math.random() * 0.2) + 0.1);
  const [floatAmplitude] = React.useState(() => (Math.random() * 0.3) + 0.1);

  useFrame((state) => {
    const { clock } = state;
    if (meshRef.current) {
      // Rotational motion
      meshRef.current.rotation.y += rotationSpeed;
      meshRef.current.rotation.x += rotationSpeed * 0.5;

      // Up-down motion
      meshRef.current.position.y = Math.sin(clock.elapsedTime * floatSpeed) * floatAmplitude + (props.position as THREE.Vector3).y;
      
      // Gentle breathing effect
      const scaleFactor = 1.1 + Math.sin(clock.elapsedTime * 0.7) * 0.05;
      meshRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  });

  let geometry;
  switch (props.geometryType) {
    case 'sphere':
      geometry = <sphereGeometry args={[0.5, 32, 32]} />;
      break;
    case 'torus':
      geometry = <torusGeometry args={[0.4, 0.15, 16, 40]} />;
      break;
    case 'roundedBox':
    default:
      // For RoundedBox, material must be a child if not using <RoundedBox material={...} />
      geometry = <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}><meshStandardMaterial color="lightblue" /></RoundedBox>;
      break;
  }

  return (
    <mesh {...props} ref={meshRef} rotation={initialRotation}>
      {props.geometryType !== 'roundedBox' && geometry}
      {props.geometryType !== 'roundedBox' && <meshStandardMaterial color={props.color || "hotpink"} />}
      {props.geometryType === 'roundedBox' && geometry} {/* This already includes material for RoundedBox */}
    </mesh>
  );
}

// Component to handle shader animation
interface ShaderAnimatorProps {
  materialRef: React.RefObject<THREE.ShaderMaterial>;
}

function ShaderAnimator({ materialRef }: ShaderAnimatorProps) {
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  return null; // This component does not render anything itself
}

// Background3D Component
export default function Background3D() {
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = {
    uTime: { value: 0 },
  };

  return (
    <div className="absolute inset-0 z-[-10]">
      <Canvas
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        frameloop="demand" // Throttle render updates, can be set to "always" or "demand"
      >
        <color attach="background" args={["#f0f4ff"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Suspense fallback={null}>
          <Environment preset="forest" background backgroundBlurriness={0.5} />
          
          {/* Shader Background Plane */}
          <mesh position={[0, 0, -5]}> {/* Position it further back */}
            <planeGeometry args={[20, 20, 1, 1]} />
            <shaderMaterial
              ref={shaderMaterialRef}
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={uniforms}
            />
          </mesh>

          {/* Floating 3D Shapes */}
          <FloatingShape position={[-2, 0.5, -2] as unknown as THREE.Vector3} geometryType="sphere" color="mediumpurple" />
          <FloatingShape position={[2, -0.5, -1]as unknown as THREE.Vector3} geometryType="torus" color="lightcoral" />
          <FloatingShape position={[0, 1, -3] as unknown as THREE.Vector3} geometryType="roundedBox" />
          
          {/* Add the animator component here, inside Suspense and Canvas */}
          <ShaderAnimator materialRef={shaderMaterialRef} />
        </Suspense>
      </Canvas>
    </div>
  );
} 