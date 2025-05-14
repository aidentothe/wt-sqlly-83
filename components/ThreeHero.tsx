"use client";

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
// import { OrbitControls, Gltf } from '@react-three/drei'; // OrbitControls for later, Gltf for actual model
import * as THREE from 'three';

// Placeholder for the GLTF model component - will eventually load the "data-cube"
function DataCube() {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Subtle autorotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1; // Adjust speed as needed
      // meshRef.current.rotation.x += delta * 0.05; 
    }
  });

  // TODO: Replace with GLTF model loading (e.g., using Drei's <Gltf src="/path/to/data-cube.gltf" />)
  // For now, a placeholder box:
  return (
    <mesh ref={meshRef} castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} /> {/* Dimensions can be adjusted */}
      <meshStandardMaterial 
        color="#6366f1" // A placeholder color, can be tuned
        emissive="#2a2a8f" // Emissive color for glow, to be enhanced by bloom
        emissiveIntensity={0.5} // Adjust intensity of emissive glow
        metalness={0.3}
        roughness={0.6} 
      />
    </mesh>
  );
}

export function ThreeHero() {
  return (
    <div 
      style={{ 
        height: '75vh', // "A 60-75 vh hero section"
        width: '100%', 
        background: 'linear-gradient(180deg, #2c2c3e 0%, #1a1a2e 100%)' // Placeholder "muted gradient"
      }}
    >
      <Canvas
        shadows // Enable shadows in the scene
        camera={{ 
          position: [0, 1, 7], // Initial camera position (z=7, slightly elevated)
          fov: 50, 
          near: 0.1, 
          far: 1000 
        }}
        // onCreated={({ gl }) => {
        //   // gl.setClearColor(...) // If specific clear color/alpha needed beyond CSS
        // }}
      >
        {/* Lighting setup: "1 × Directional + 1 × Ambient light balanced for SDR monitors" */}
        <ambientLight intensity={0.7} /> {/* Adjust intensity as needed */}
        <directionalLight
          castShadow
          position={[8, 10, 8]} // Adjust position for desired shadow/highlight angle
          intensity={1.8} // Adjust intensity as needed
          shadow-mapSize-width={2048} // Higher res for sharper shadows
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        
        <Suspense fallback={null}> {/* Good practice for async loading, like GLTFs */}
          <DataCube />
        </Suspense>

        {/* 
          Future additions based on your plan:
          - Post-processing pipeline (UnrealBloomPass, FXAAPass, SSAO)
          - Scroll-driven camera animation (GSAP ScrollTrigger)
          - Interactive Particle Layer
          - OrbitControls on double-click 
        */}
      </Canvas>
    </div>
  );
} 