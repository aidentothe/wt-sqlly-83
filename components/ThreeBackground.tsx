import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, Environment, useScroll } from '@react-three/drei';
import * as THREE from 'three';

import { Particles } from './Particles';
import { MyEffects } from '../lib/three/effects';
import { InteractiveGrid } from './InteractiveGrid';

interface SceneContentProps {
  showFallback: boolean;
}

function SceneContent({ showFallback }: SceneContentProps) {
  const { camera: sceneCamera } = useThree();
  const scroll = useScroll();

  const initialCameraZ = 7;
  const targetCameraZ = 4;

  useFrame(() => {
    if (showFallback) return;

    const offset = scroll.offset;
    sceneCamera.position.z = THREE.MathUtils.lerp(initialCameraZ, targetCameraZ, offset);
  });

  return (
    <>
      <InteractiveGrid />
      <Particles />
      
      <Environment preset="city" background />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8}
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight intensity={0.3} />

      {/* {!showFallback ? <MyEffects /> : null} Post-processing commented out again */}
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