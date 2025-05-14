import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export function useSimpleMousePosition() {
  const { size } = useThree(); // Get canvas dimensions for normalization
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse position to be -0.5 to 0.5
      // (or 0 to 1 if preferred, adjust shader accordingly)
      const x = (event.clientX / size.width) - 0.5;
      const y = (event.clientY / size.height) - 0.5; // Y is often inverted in WebGL UVs vs screen
      setMousePosition({ x, y: -y }); // Inverting y to match typical top-left origin expectations for shader
    };

    // We need to ensure this listener is attached to the correct element (e.g., the canvas itself or window)
    // For simplicity, let's use window for now. For more precise control, event source from R3F might be better.
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [size.width, size.height]);

  return mousePosition;
} 