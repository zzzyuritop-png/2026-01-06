import React, { useEffect, useRef, useState } from 'react';

export const BackgroundMusic = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Song: 赶路的蝴蝶 (Butterfly on the Way) - 依加
    const MUSIC_URL = "http://music.163.com/song/media/outer/url?id=1895244308.mp3";

    useEffect(() => {
        const attemptPlay = async () => {
            if (audioRef.current) {
                try {
                    audioRef.current.volume = 0.5;
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    console.log("Autoplay blocked, waiting for interaction");
                    setIsPlaying(false);
                }
            }
        };
        
        // Attempt immediate playback
        attemptPlay();
        
        // Also add a global click listener to fallback if autoplay blocked
        const handleInteraction = () => {
             if (audioRef.current && audioRef.current.paused) {
                 attemptPlay();
             }
        };
        window.addEventListener('click', handleInteraction, { once: true });
        
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
            <audio 
                ref={audioRef} 
                src={MUSIC_URL} 
                loop 
                crossOrigin="anonymous" 
                autoPlay 
            />
            
            <button 
                onClick={togglePlay}
                className={`
                    group flex items-center justify-center w-10 h-10 rounded-full 
                    border border-white/20 backdrop-blur-md transition-all duration-500
                    ${isPlaying ? 'bg-white/10 hover:bg-white/20' : 'bg-transparent hover:bg-white/5'}
                `}
            >
                {isPlaying ? (
                    // Pause Icon
                    <div className="flex gap-1">
                        <div className="w-0.5 h-3 bg-white/80 rounded-full animate-[bounce_1s_infinite]" />
                        <div className="w-0.5 h-3 bg-white/80 rounded-full animate-[bounce_1.2s_infinite]" />
                        <div className="w-0.5 h-3 bg-white/80 rounded-full animate-[bounce_0.8s_infinite]" />
                    </div>
                ) : (
                    // Play Icon
                    <svg className="w-4 h-4 text-white/80 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>
            <div className={`
                text-[10px] text-white/50 font-serif tracking-widest uppercase transition-opacity duration-700
                ${isPlaying ? 'opacity-100' : 'opacity-0'}
            `}>
                赶路的蝴蝶
            </div>
        </div>
    );
};