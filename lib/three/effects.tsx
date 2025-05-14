import React from 'react';
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing';

interface MyEffectsProps {
  bloomStrength?: number;
  bloomRadius?: number;
}

export function MyEffects(props: MyEffectsProps): JSX.Element {
  const { 
    bloomStrength = 0.7, 
    bloomRadius = 0.6 
  } = props;

  return (
    <EffectComposer multisampling={0} disableNormalPass={true}>
      <Bloom 
        intensity={bloomStrength}
        luminanceThreshold={0}
        luminanceSmoothing={0.025}
        mipmapBlur={true}
        kernelSize={3}
        radius={bloomRadius}
      />
      <FXAA />
    </EffectComposer>
  );
} 