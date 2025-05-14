import React from 'react';
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing';
// If UnrealBloomPass or specific SSAO pass is needed and not directly in @react-three/postprocessing,
// you might need to import them from 'postprocessing' or 'three/examples/jsm/postprocessing/...'
// For example:
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// extend({ UnrealBloomPass }); // If it's a custom pass for R3F

interface MyEffectsProps {
  bloomStrength?: number;
  bloomRadius?: number;
}

export function MyEffects(props: MyEffectsProps) {
  const { 
    bloomStrength = 0.7, 
    bloomRadius = 0.6 
  } = props;

  return (
    <EffectComposer multisampling={0} disableNormalPass={true}>
      {/* RenderPass is usually implicitly handled or not needed if you compose effects directly,
          but can be added if specific render target logic is required.
          The new @react-three/postprocessing handles this more directly. */}
      {/* <RenderPass /> */}
      
      {/* UnrealBloomPass equivalent in @react-three/postprocessing is <Bloom /> */}
      <Bloom 
        intensity={bloomStrength}
        luminanceThreshold={0} // Adjust if only bright parts should bloom
        luminanceSmoothing={0.025}
        mipmapBlur={true} // Better quality bloom
        // kernelSize can be one of: KernelSize.VERY_SMALL, KernelSize.SMALL, KernelSize.MEDIUM, KernelSize.LARGE, KernelSize.HUGE
        // We'll use a numeric value if the direct enum isn't available or for more control.
        // The `postprocessing` library's BloomEffect uses `KernelSize` enum (0-4 or 5 for adaptive). 
        // Let's assume a moderate kernel size for now, will need to import KernelSize enum if available and desired.
        kernelSize={3} // Placeholder for KernelSize.MEDIUM
        radius={bloomRadius}
      />
      <FXAA />
      
      {/* (Optional) SSAO - can be added here using <SSAO /> from @react-three/postprocessing */}
      {/* Example: <SSAO radius={0.5} intensity={10} luminanceInfluence={0.5} color="black" /> */}
    </EffectComposer>
  );
} 