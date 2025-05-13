'use client';

import dynamic from 'next/dynamic';

// Dynamically import the actual 3D scene, ensuring it only runs on the client
const Background3D = dynamic(() => import('./Background3D'), { 
  ssr: false,
  // Optional: You can add a loading component here if the 3D scene takes time to load
  // loading: () => <p>Loading 3D Experience...</p> 
});

export default function Background3DWrapper() {
  return <Background3D />;
} 