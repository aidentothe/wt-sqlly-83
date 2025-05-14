import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// You might need a noise library if you want complex drift, e.g., 'simplex-noise'
// For a very simple drift, Math.random or trigonometric functions can be used in useFrame.

const PARTICLE_COUNT = 400;
const PARTICLE_SPREAD = 20; // How far particles spread out on XZ plane
const PARTICLE_Y_RANGE = 5; // Vertical spread

export function Particles() {
  const pointsRef = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const posArray = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      posArray[i * 3 + 0] = (Math.random() - 0.5) * PARTICLE_SPREAD;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * PARTICLE_Y_RANGE;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    return geom;
  }, []);

  // Store original y positions for drift calculation to prevent accumulation
  const originalY = useMemo(() => {
    if (!geometry.attributes.position) return new Float32Array(0);
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const yValues = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      yValues[i] = posAttr.getY(i);
    }
    return yValues;
  }, [geometry]);

  useFrame((state) => {
    if (pointsRef.current && pointsRef.current.geometry) {
      const time = state.clock.getElapsedTime() * 0.05;
      const positionsAttribute = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = positionsAttribute.getX(i);
        // Apply drift to original y position to prevent it from flying off
        const newY = originalY[i] + Math.sin(time + x * 0.5) * 0.1; // Increased drift a bit for visibility
        positionsAttribute.setY(i, newY);
      }
      positionsAttribute.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#8888cc"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
} 