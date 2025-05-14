"use client";

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TileProps {
  pos: [number, number, number];
  // We will add an identifier for raycasting later
  tileId: string;
}

const Tile: React.FC<TileProps> = ({ pos, tileId }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  // Dispose geometry and material on unmount
  React.useEffect(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    return () => {
      mesh?.geometry?.dispose();
      material?.dispose();
    };
  }, []);

  return (
    <mesh ref={meshRef} position={pos} castShadow receiveShadow name={tileId}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#0a192f"
        emissive="#00bfff"
        emissiveIntensity={0.05}
        transparent
        opacity={0.35} // Initial dim opacity
      />
    </mesh>
  );
};

const GridInteractions = ({ tilesGroupRef }: { tilesGroupRef: React.RefObject<THREE.Group> }) => {
  const { raycaster, camera, size, scene } = useThree();
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const [intersectedTile, setIntersectedTile] = useState<THREE.Object3D | null>(null);

  const [canHover, setCanHover] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const hoverMediaQuery = window.matchMedia('(hover: hover)');
    setCanHover(hoverMediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setCanHover(event.matches);
    hoverMediaQuery.addEventListener('change', handleChange);

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    const handleReducedMotionChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      hoverMediaQuery.removeEventListener('change', handleChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!canHover || prefersReducedMotion || !tilesGroupRef.current) return;

    pointer.x = (event.clientX / size.width) * 2 - 1;
    pointer.y = -(event.clientY / size.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(tilesGroupRef.current.children, true);

    if (intersects.length > 0) {
      // Check if the intersected object is one of our tiles (meshes)
      const firstIntersectedMesh = intersects[0].object;
      if (firstIntersectedMesh instanceof THREE.Mesh && tilesGroupRef.current.children.includes(firstIntersectedMesh)) {
        if (intersectedTile !== firstIntersectedMesh) {
          setIntersectedTile(firstIntersectedMesh);
        }
      } else {
        setIntersectedTile(null);
      }
    } else {
      setIntersectedTile(null);
    }
  }, [raycaster, camera, size, tilesGroupRef, canHover, prefersReducedMotion, pointer, intersectedTile]);

  useEffect(() => {
    if (!canHover) return;
    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [onPointerMove, canHover]);

  useFrame(() => {
    if (prefersReducedMotion || !tilesGroupRef.current) {
        // Reset to default if motion is reduced
        tilesGroupRef.current?.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissiveIntensity = 0.05;
                child.material.opacity = 0.35;
            }
        });
        return;
    }

    tilesGroupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const material = child.material;
        const targetEmissiveIntensity = (intersectedTile === child) ? 1 : 0.05;
        const targetOpacity = (intersectedTile === child) ? 1 : 0.35;
        const easingFactor = 0.08;

        material.emissiveIntensity += (targetEmissiveIntensity - material.emissiveIntensity) * easingFactor;
        material.opacity += (targetOpacity - material.opacity) * easingFactor;
      }
    });
  });

  return null; // This component does not render anything itself
};

const GridBackground = () => {
  const tilesRef = useRef<THREE.Group>(null!);

  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}
      camera={{ position: [0, 4, 6], fov: 45 }}
      shadows
      // colorManagement is on by default in R3F v8+ (linear workflow)
      // physicallyCorrectLights is also generally handled by modern R3F defaults with PBR materials
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      {/* Lights and Tiles will be added here */}
      <ambientLight color="#111111" intensity={1} />
      <directionalLight
        position={[3, 6, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-normalBias={0.02}
      />
      <group rotation-x={-Math.PI / 2} ref={tilesRef}>
        <Tile pos={[-1.05, 0, 1.05]} tileId="tile-0" />
        <Tile pos={[1.05, 0, 1.05]} tileId="tile-1" />
        <Tile pos={[-1.05, 0, -1.05]} tileId="tile-2" />
        <Tile pos={[1.05, 0, -1.05]} tileId="tile-3" />
      </group>
      <GridInteractions tilesGroupRef={tilesRef} />
      {/* Invisible ground plane for shadows */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>
    </Canvas>
  );
};

export default GridBackground; 