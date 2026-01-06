import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export type InteractionMode = 'normal' | 'frozen' | 'fast' | 'rotateLeft' | 'rotateRight';

interface HandInteractionProps {
    onModeChange: (mode: InteractionMode) => void;
}

export const HandInteraction: React.FC<HandInteractionProps> = ({ onModeChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const [currentMode, setCurrentMode] = useState<InteractionMode>('normal');

    useEffect(() => {
        let handLandmarker: HandLandmarker | null = null;
        let animationFrameId: number;
        let lastVideoTime = -1;

        const setup = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
                );

                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });

                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 320, height: 240, facingMode: "user" }
                    });

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.addEventListener('loadeddata', () => {
                            setStatus('Active');
                            predict();
                        });
                    }
                }
            } catch (err) {
                console.error("Error initializing hand tracking:", err);
                setStatus('Camera Error');
            }
        };

        const predict = () => {
            if (videoRef.current && handLandmarker) {
                const startTimeMs = performance.now();
                if (videoRef.current.currentTime !== lastVideoTime) {
                    lastVideoTime = videoRef.current.currentTime;
                    const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

                    let newMode: InteractionMode = 'normal';

                    if (results.landmarks && results.landmarks.length > 0) {
                        const landmarks = results.landmarks[0];
                        
                        // Landmarks are normalized [0, 1]. 
                        // x: 0 (left) -> 1 (right)
                        // y: 0 (top) -> 1 (bottom)
                        const wristX = landmarks[0].x;
                        const wristY = landmarks[0].y;
                        
                        // Check for Open Hand (Fingers Spread)
                        const tips = [4, 8, 12, 16, 20];
                        let totalDist = 0;
                        tips.forEach(tipIdx => {
                            const dx = landmarks[tipIdx].x - landmarks[0].x;
                            const dy = landmarks[tipIdx].y - landmarks[0].y;
                            totalDist += Math.sqrt(dx*dx + dy*dy);
                        });
                        const avgDist = totalDist / 5;
                        const isOpen = avgDist > 0.35; // Threshold for open hand

                        if (isOpen) {
                            newMode = 'frozen';
                        } else if (wristY > 0.7) {
                            // Hand at bottom -> Snow falls fast
                            newMode = 'fast';
                        } else if (wristX < 0.3) {
                            // Hand on the left side
                            // Note: Selfie camera is often mirrored.
                            // If user moves hand to their left, in video it might appear on right if mirrored, or left if not.
                            // HandLandmarker coordinates usually match the video element.
                            // Assuming standard mirror behavior: Hand Left on screen -> Left side of video.
                            newMode = 'rotateLeft';
                        } else if (wristX > 0.7) {
                            // Hand on the right side
                            newMode = 'rotateRight';
                        } else {
                            newMode = 'normal';
                        }
                    }

                    setCurrentMode(newMode);
                    onModeChange(newMode);
                }
                animationFrameId = requestAnimationFrame(predict);
            }
        };

        setup();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (handLandmarker) handLandmarker.close();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [onModeChange]);

    const getModeLabel = (mode: InteractionMode) => {
        switch(mode) {
            case 'frozen': return '❄️ FREEZE ❄️';
            case 'fast': return '⚡ FAST ⚡';
            case 'rotateLeft': return '🔄 ROTATE LEFT';
            case 'rotateRight': return 'ROTATE RIGHT 🔄';
            default: return 'NORMAL';
        }
    };

    return (
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
            {/* Camera Feedback Screen */}
            <div className={`
                relative overflow-hidden rounded-xl border-2 transition-all duration-300 shadow-2xl
                ${currentMode !== 'normal' ? 'border-cyan-400 scale-105' : 'border-white/20'}
            `}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-48 h-36 object-cover transform scale-x-[-1] bg-black/50"
                />
                
                {/* Status Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md py-2 text-center">
                    <span className={`text-xs font-bold font-mono tracking-wider ${currentMode !== 'normal' ? 'text-cyan-300' : 'text-white/70'}`}>
                        {getModeLabel(currentMode)}
                    </span>
                </div>
            </div>

            {/* Instruction Hints */}
            <div className="flex flex-col gap-1 text-[10px] text-white/40 font-mono ml-1">
                <div className={currentMode === 'frozen' ? 'text-cyan-300' : ''}>• Open Hand: Freeze</div>
                <div className={currentMode === 'fast' ? 'text-cyan-300' : ''}>• Hand Down: Speed Up</div>
                <div className={currentMode === 'rotateLeft' ? 'text-cyan-300' : ''}>• Hand Left: Rotate Left</div>
                <div className={currentMode === 'rotateRight' ? 'text-cyan-300' : ''}>• Hand Right: Rotate Right</div>
            </div>
        </div>
    );
};