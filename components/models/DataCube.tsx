import React, { useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface DataCubeProps {
  // Props to control position, rotation, scale, etc., can be added here
  // For GSAP, we might pass a ref or use a group to animate.
}

// ForwardRef is used to pass the ref to the underlying mesh for GSAP control
const DataCube = React.forwardRef<THREE.Group, DataCubeProps>((props, ref) => {
  // Path to your GLB model in the /public directory
  // User mentioned "/public/models/data-cube.glb (placeholder ok)"
  const modelPath = '/models/data-cube.glb'; // Path relative to /public
  const { scene } = useGLTF(modelPath);

  // If you need to manipulate individual meshes within the GLTF, you can traverse the scene.
  // For now, we'll treat the loaded scene as a single unit.
  // To expose a specific mesh for GSAP, you might need to find it by name:
  // const specificMeshRef = useRef<THREE.Mesh>(null!);
  // useEffect(() => {
  //   scene.traverse((child) => {
  //     if ((child as THREE.Mesh).isMesh && child.name === 'YourMeshName') {
  //       if (specificMeshRef.current !== child) {
  //         // specificMeshRef.current = child as THREE.Mesh;
  //         // If the ref prop for forwardRef is meant for this specific mesh:
  //         if (typeof ref === 'function') ref(child as THREE.Mesh); 
  //         else if (ref) ref.current = child as THREE.Mesh;
  //       }
  //     }
  //   });
  // }, [scene, ref]);

  // For simplicity, we'll return the whole scene wrapped in a group, and `ref` will point to this group.
  // GSAP can then animate this group.
  return (
    <Suspense fallback={null}> {/* Fallback for useGLTF pending load */}
      <group ref={ref} {...props}>
        <primitive object={scene} />
      </group>
    </Suspense>
  );
});

DataCube.displayName = 'DataCube';

export { DataCube }; 