
import React, { useState, useEffect } from 'react';
import { generateOpeningHook, playRawAudio } from '../services/geminiService';
import { TropeType } from '../types';

interface CastingDirectorProps {
    onComplete: (trope: TropeType, reaction: string) => void;
}

const CastingDirector: React.FC<CastingDirectorProps> = ({ onComplete }) => {
    const [step, setStep] = useState<'init' | 'listening' | 'reacting'>('init');
    const [hookData, setHookData] = useState<{ text: string, audio: string, trope: TropeType } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHook = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const aistudio = (window as any).aistudio;
            if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
                 const hasKey = await aistudio.hasSelectedApiKey();
                 if (!hasKey) {
                     await aistudio.openSelectKey();
                 }
            }

            const data = await generateOpeningHook();
            if (data) {
                setHookData(data);
                setStep('listening');
            } else {
                setError("Connection timeout. The line is busy.");
            }
        } catch (e) {
            console.error("Hook failed", e);
            setError("Unable to establish connection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHook();
    }, []);

    const handlePlayHook = async () => {
        if (!hookData) return;
        setStep('reacting'); // Advance immediately for speed
        if (hookData.audio) {
            playRawAudio(hookData.audio).catch(e => console.warn("Audio playback failed", e));
        }
    };

    if (step === 'init') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 animate-slow-fade">
                <h1 className="text-5xl font-extralight italic text-davinci-gold mb-4">The Intimacy</h1>
                <p className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-8">A direct line to your subconscious</p>
                {isLoading ? (
                     <div className="flex flex-col items-center space-y-6">
                         <div className="flex space-x-2">
                            <div className="w-1 h-12 bg-davinci-red animate-[bounce_1s_infinite]"></div>
                            <div className="w-1 h-12 bg-davinci-red animate-[bounce_1s_infinite_0.2s]"></div>
                            <div className="w-1 h-12 bg-davinci-red animate-[bounce_1s_infinite_0.4s]"></div>
                         </div>
                         <p className="text-[10px] tracking-[0.5em] text-davinci-gold uppercase animate-pulse">Scanning Waves...</p>
                     </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {error && <p className="text-xs text-davinci-red mb-6 tracking-widest">{error}</p>}
                        <button 
                            onClick={loadHook}
                            className="bg-transparent border border-davinci-gold/30 px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] text-davinci-gold hover:bg-davinci-gold hover:text-black transition-all"
                        >
                            Reconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (step === 'listening') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-black text-center p-8 cursor-pointer group" onClick={handlePlayHook}>
                <div className="w-32 h-32 rounded-full border border-davinci-gold/20 flex items-center justify-center mb-10 relative overflow-hidden transition-all group-hover:border-davinci-gold/60">
                    <div className="absolute inset-0 bg-davinci-gold/5 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full"></div>
                    <span className="text-4xl relative z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                        {hookData?.audio ? '▶' : '...'}
                    </span>
                    <div className="absolute inset-0 rounded-full border border-davinci-red opacity-0 animate-ping" style={{ animationDuration: '3s' }}></div>
                </div>
                <h2 className="text-4xl font-extralight italic text-white mb-3">He's speaking.</h2>
                <p className="text-[10px] tracking-[0.4em] uppercase text-davinci-gold">Tap to Accept the Call</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-slow-fade bg-black p-6 text-center">
            <div className="mb-16 max-w-lg space-y-4">
                <div className="w-12 h-[1px] bg-davinci-gold/30 mx-auto mb-8"></div>
                <p className="text-white font-serif italic text-3xl leading-relaxed">"{hookData?.text}"</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                <button 
                    onClick={() => onComplete(hookData!.trope, "Defiant")}
                    className="p-8 border border-white/5 text-white hover:bg-davinci-red hover:border-davinci-red transition-all group"
                >
                    <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-gray-500 group-hover:text-white/60 mb-3">Challenge Him</span>
                    <span className="font-serif italic text-2xl">"Don't hold your breath."</span>
                </button>

                <button 
                    onClick={() => onComplete(hookData!.trope, "Surrendered")}
                    className="p-8 border border-white/5 text-white hover:bg-white hover:text-black transition-all group"
                >
                    <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-gray-500 group-hover:text-black/60 mb-3">Welcome Him</span>
                    <span className="font-serif italic text-2xl">"I'm all yours."</span>
                </button>
            </div>
        </div>
    );
};

export default CastingDirector;
