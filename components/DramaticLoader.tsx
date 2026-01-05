
import React, { useState, useEffect } from 'react';

interface DramaticLoaderProps {
  trope: string;
  vibe: string;
}

const POETIC_BEATS = [
  "FINDING HIS VOICE...",
  "CAPTURING HIS EYES...",
  "STUDYING HIS HEART...",
  "SETTING THE SCENE...",
  "ALMOST REACHING HIM...",
  "SHARPENING THE FOCUS...",
  "BREATHING LIFE INTO LORE...",
  "ALMOST THERE..."
];

const DramaticLoader: React.FC<DramaticLoaderProps> = ({ trope, vibe }) => {
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBeatIndex((prev) => (prev + 1) % POETIC_BEATS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-davinci-red/5 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 text-center space-y-12 max-w-lg px-8">
        <div className="animate-slow-fade">
            <h2 className="text-5xl font-extralight italic text-white mb-2">{trope}</h2>
            <p className="text-davinci-gold tracking-[0.3em] uppercase text-[10px]">{vibe}</p>
        </div>

        <div className="h-12 flex items-center justify-center">
            <p className="text-xl font-light tracking-[0.1em] text-white opacity-60 animate-pulse-subtle">
                {POETIC_BEATS[beatIndex]}
            </p>
        </div>

        <div className="w-48 h-[1px] bg-white/10 mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-davinci-gold animate-[loading_4s_linear_infinite] w-full origin-left"></div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

export default DramaticLoader;
