import { useSpring } from '@react-spring/three'; // Or a similar spring library
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

// TODO: Implement actual mouse tracking and spring updates
export function useMouseParallax() {
  const { size } = useThree(); // For normalizing coordinates

  // Placeholder springs
  const [{ rotateX, rotateY }, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    config: { mass: 1, tension: 120, friction: 14, precision: 0.0001 },
  }));

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      // Normalize mouse position to -1 to 1 range
      const x = (clientX / size.width) * 2 - 1;
      const y = -(clientY / size.height) * 2 + 1;

      // Map normalized position to rotation angles (e.g., ±7 degrees)
      const maxRotation = Math.PI / (180 / 7); // 7 degrees in radians

      api.start({
        rotateX: y * maxRotation,
        rotateY: x * maxRotation,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [api, size.width, size.height]);

  return { rotateX, rotateY };
} 