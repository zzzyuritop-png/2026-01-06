import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { COLORS } from './utils/constants';
import { PinkTreeParticles } from './components/PinkTreeParticles';
import { SnowParticles, BaseRings, TopStar } from './components/Decorations';
import { SceneEffects } from './components/SceneEffects';
import { HandInteraction, InteractionMode } from './components/HandInteraction';

const App = () => {
    // State controls the interaction behavior (snow + rotation)
    const [interactionMode, setInteractionMode] = useState<InteractionMode>('normal');

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <HandInteraction onModeChange={setInteractionMode} />

            <Canvas
                camera={{ position: [0, 8, 24], fov: 45 }}
                gl={{ 
                    antialias: false, 
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: true 
                }}
                dpr={[1, 2]} 
            >
                <color attach="background" args={[COLORS.background]} />
                
                <Suspense fallback={null}>
                    {/* Tree is static now (explosion=0) */}
                    <PinkTreeParticles explosionValue={0} />
                    
                    <TopStar /> 
                    <BaseRings />
                    
                    {/* Snow behavior changes based on interaction */}
                    <SnowParticles mode={interactionMode} />
                    
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                        <planeGeometry args={[50, 50]} />
                        <meshBasicMaterial color="#000000" />
                    </mesh>
                    
                    {/* Scene effects control camera rotation */}
                    <SceneEffects mode={interactionMode} />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default App;