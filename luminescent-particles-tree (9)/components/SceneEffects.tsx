import React from 'react';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { CONFIG } from '../utils/constants';
import { InteractionMode } from './HandInteraction';

interface SceneEffectsProps {
    mode: InteractionMode;
}

export const SceneEffects: React.FC<SceneEffectsProps> = ({ mode }) => {
    // Determine rotation speed based on mode
    let autoRotateSpeed = 0.5; // Default slow rotation

    if (mode === 'rotateLeft') {
        // Rotate scene left => Camera orbits Right (CW) => Negative speed?
        // OrbitControls autoRotate: "speed of rotation".
        // Positive speed rotates left (CCW).
        // To make scene appear to rotate LEFT, camera must move RIGHT (CW).
        // So speed should be negative.
        autoRotateSpeed = -8.0; 
    } else if (mode === 'rotateRight') {
        // Scene rotates right => Camera orbits Left (CCW) => Positive speed.
        autoRotateSpeed = 8.0;
    } else if (mode === 'fast') {
        autoRotateSpeed = 2.0; // Slightly faster when snowing fast
    } else if (mode === 'frozen') {
        autoRotateSpeed = 0;
    }

    return (
        <>
            <OrbitControls 
                enablePan={false}
                enableZoom={true}
                minDistance={5}
                maxDistance={30}
                maxPolarAngle={Math.PI / 2 - 0.05}
                autoRotate
                autoRotateSpeed={autoRotateSpeed}
                target={[0, CONFIG.treeHeight / 2, 0]}
            />
            <EffectComposer disableNormalPass>
                <Bloom 
                    intensity={CONFIG.bloomStrength} 
                    luminanceThreshold={CONFIG.bloomThreshold} 
                    luminanceSmoothing={0.9} 
                    mipmapBlur
                    radius={CONFIG.bloomRadius}
                />
                <ToneMapping exposure={1.2} />
            </EffectComposer>
        </>
    );
};