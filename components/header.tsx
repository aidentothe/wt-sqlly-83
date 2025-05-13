"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Logo3D } from "@/components/logo-3d"
import { ModeToggle } from "@/components/mode-toggle"

export function Header() {
  const [mounted, setMounted] = useState(false)
  const [webGLFailed, setWebGLFailed] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="border-b bg-background">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-md"></div>
            <h1 className="text-2xl font-bold">wt-sqlly</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 relative">
            {webGLFailed ? (
              <div className="h-full w-full bg-primary rounded-full flex items-center justify-center text-white font-bold">
                SQL
              </div>
            ) : (
              <Canvas
                onCreated={({ gl }) => {
                  gl.setClearColor("#000000", 0)
                }}
                onError={(error) => {
                  console.error("Canvas error:", error)
                  setWebGLFailed(true)
                }}
              >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <Logo3D />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={4} />
              </Canvas>
            )}
          </div>
          <h1 className="text-2xl font-bold">wt-sqlly</h1>
          <p className="text-muted-foreground hidden md:block">CSV to SQL Query Builder</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
