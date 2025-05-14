import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ScrollControls, Environment, useScroll } from '@react-three/drei';
import * as THREE from 'three';
// import { gsap } from 'gsap'; // GSAP might not be needed if useScroll is sufficient
// import { ScrollTrigger } from 'gsap/ScrollTrigger'; // GSAP might not be needed

import { DataCube } from './models/DataCube';
import { Particles } from './Particles';
import { MyEffects } from '../lib/three/effects'; // Will be uncommented if effects.ts is fixed
import { useMouseParallax } from '../hooks/useMouseParallax';

// gsap.registerPlugin(ScrollTrigger); // GSAP might not be needed

interface SceneContentProps {
  showFallback: boolean;
}

// Define SceneContent at the top level of the module
function SceneContent({ showFallback }: SceneContentProps) {
  const cubeRef = useRef<THREE.Group>(null);
  const { camera: sceneCamera } = useThree(); // Access camera from this new context
  const scroll = useScroll(); // For scroll-based animations within R3F
  const { rotateX, rotateY } = useMouseParallax(); // Mouse parallax hook

  // Initial and target values for animations
  const initialCameraZ = 7; // Matches Canvas initial camera position
  const targetCameraZ = 4;  // As per previous GSAP attempt, plan: "z = −8 → −4" or "2 -> 3.5"
  const cubeInitialYRotation = 0;
  const cubeTargetYRotation = Math.PI * 2; // Spins exactly once

  useFrame(() => {
    if (showFallback) return; // Do not run animations if fallback is shown

    // Parallax effect on DataCube
    if (cubeRef.current) {
      let currentRotateX = 0;
      let currentRotateY = 0;
      if (rotateX && typeof (rotateX as any).get === 'function') currentRotateX = (rotateX as any).get();
      if (rotateY && typeof (rotateY as any).get === 'function') currentRotateY = (rotateY as any).get();
      
      cubeRef.current.rotation.x = THREE.MathUtils.lerp(cubeRef.current.rotation.x, currentRotateX, 0.1);
      cubeRef.current.rotation.y = THREE.MathUtils.lerp(cubeRef.current.rotation.y, currentRotateY, 0.1);
    }

    // Scroll-based animations using useScroll().offset
    const offset = scroll.offset;
    sceneCamera.position.z = THREE.MathUtils.lerp(initialCameraZ, targetCameraZ, offset);
    if (cubeRef.current) {
      cubeRef.current.rotation.y = THREE.MathUtils.lerp(cubeInitialYRotation, cubeTargetYRotation, offset);
    }
  });

  return (
    <>
      <DataCube ref={cubeRef} />
      <Particles /> {/* TODO: Implement Particles */}
      <Environment preset="city" background /> {/* Removed intensity prop */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 2, 5]} intensity={0.4} /> {/* Fill light */}
      <directionalLight position={[0, 0, -5]} intensity={0.8} color="#60a5fa" /> {/* Rim light */}
      <ambientLight intensity={0.5} />
      {/* {!showFallback ? <MyEffects /> : null} Post-processing temporarily commented out */}
    </>
  );
}

export function ThreeBackground() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkFallback = () => {
      if (mediaQueryReducedMotion.matches || window.innerWidth < 768) {
        setShowFallback(true);
      } else {
        setShowFallback(false);
      }
    };
    checkFallback();
    mediaQueryReducedMotion.addEventListener('change', checkFallback);
    window.addEventListener('resize', checkFallback);
    return () => {
      mediaQueryReducedMotion.removeEventListener('change', checkFallback);
      window.removeEventListener('resize', checkFallback);
    };
  }, []);

  if (showFallback) {
    return (
      <div 
        className="relative isolate h-[100vh] w-full overflow-hidden bg-gray-800 flex items-center justify-center text-white"
      >
        Fallback Hero Image (WebGL disabled or reduced motion)
      </div>
    );
  }

  return (
    <div className="relative isolate h-[100vh] w-full overflow-hidden scroll-controls-wrapper">
      <Canvas
        shadows
        camera={{ position: [0, 0, 7], fov: 50, near: 0.1, far: 1000 }} 
      >
        <ScrollControls pages={1} damping={0.25}>
          <Suspense fallback={null}>
            <SceneContent showFallback={showFallback} />
          </Suspense>
        </ScrollControls>
      </Canvas>
    </div>
  );
} 