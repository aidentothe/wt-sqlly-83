"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh, MeshStandardMaterial } from "three"

export function Logo3D() {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5
    }

    if (materialRef.current) {
      materialRef.current.color.setHSL((Math.sin(state.clock.getElapsedTime() * 0.2) + 1) / 2, 0.5, 0.5)
    }
  })

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={0.5}>
        <torusKnotGeometry args={[0.8, 0.2, 128, 32]} />
        <meshStandardMaterial ref={materialRef} color="#6366f1" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -1.5]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#000000" opacity={0.1} transparent />
      </mesh>
    </group>
  )
}
