import React, { useState, useEffect, useRef } from 'react';
import { BoyfriendProfile, MicroBeat, UserWallet, ECONOMY_COSTS } from '../types';
import { playRawAudio, generateVoiceResponse, generateIntimatesImage, connectLiveCall } from '../services/geminiService';
import { generateWhisperExperience, trackWhisperEngagement } from '../services/whisperBackService';
import ChatInterface from './ChatInterface';

interface FantasyDashboardProps {
    profile: BoyfriendProfile;
    imageUrl: string | null;
    isImageLoading: boolean;
    onReset: () => void;
    wallet: UserWallet;
    spendCoins: (amount: number) => boolean;
    earnCoins: (amount: number) => void;
}

const FantasyDashboard: React.FC<FantasyDashboardProps> = ({ 
    profile, imageUrl, isImageLoading, onReset, 
    wallet, spendCoins, earnCoins 
}) => {
    const [chatOpen, setChatOpen] = useState(false);
    const [activeBeat, setActiveBeat] = useState<MicroBeat | null>(null);
    const [beatIndex, setBeatIndex] = useState(0);

    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [privateImageUrl, setPrivateImageUrl] = useState<string | null>(null);
    const [isPrivateImageLoading, setIsPrivateImageLoading] = useState(false);
    const [showLetter, setShowLetter] = useState(false);
    const [isPlayingVoicemail, setIsPlayingVoicemail] = useState(false);
    const [isLiveCalling, setIsLiveCalling] = useState(false);
    const liveSessionRef = useRef<any>(null);

    // NEW: WhisperBack state
    const [isGeneratingWhisper, setIsGeneratingWhisper] = useState(false);
    const [whisperAudio, setWhisperAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlayingWhisper, setIsPlayingWhisper] = useState(false);
    const whisperStartTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!profile.microBeats || profile.microBeats.length === 0) return;
        setBeatIndex(0);
        setActiveBeat(profile.microBeats[0]);
        const interval = setInterval(() => {
            setBeatIndex((prev) => {
                const next = (prev + 1) % profile.microBeats!.length;
                setActiveBeat(profile.microBeats![next]);
                return next;
            });
        }, 6000); 
        return () => clearInterval(interval);
    }, [profile.microBeats]);

    const handleUnlockBundle = async () => {
        if (spendCoins(ECONOMY_COSTS.UNLOCK_VAULT)) {
            setIsVaultUnlocked(true);
            setIsPrivateImageLoading(true);
            try {
                const img = await generateIntimatesImage(profile, imageUrl || undefined);
                setPrivateImageUrl(img);
            } catch (e) { console.error(e); } 
            finally { setIsPrivateImageLoading(false); }
        }
    };

    const handlePlayVoicemail = async () => {
        if (isPlayingVoicemail) return;
        setIsPlayingVoicemail(true);
        try {
            const script = profile.secretVoicemailScript || profile.hookLine;
            const audio = await generateVoiceResponse(script, profile.voicePersonality);
            await playRawAudio(audio);
        } catch(e) { console.error(e); }
        finally { setIsPlayingVoicemail(false); }
    };

    const handleStartLiveCall = async () => {
        if (isLiveCalling) {
            liveSessionRef.current?.stop();
            setIsLiveCalling(false);
            return;
        }
        
        setIsLiveCalling(true);
        try {
            liveSessionRef.current = await connectLiveCall(profile, () => {}, () => setIsLiveCalling(false));
        } catch(e) {
            console.error(e);
            setIsLiveCalling(false);
        }
    };

    // NEW: WhisperBack handler
    const handleWhisper = async () => {
        if (isGeneratingWhisper || isPlayingWhisper) return;
        
        setIsGeneratingWhisper(true);
        whisperStartTimeRef.current = Date.now();
        
        try {
            console.log('🎧 Generating whisper experience...');
            
            const experience = await generateWhisperExperience(
                profile.name,
                profile.trope,
                profile.visualDescription
            );
            
            console.log('✅ Whisper ready:', experience);
            
            // Create and play audio
            const audio = new Audio(experience.audioUrl);
            setWhisperAudio(audio);
            
            audio.onplay = () => {
                setIsPlayingWhisper(true);
                console.log('▶️ Whisper playing');
            };
            
            audio.onended = () => {
                const duration = Date.now() - whisperStartTimeRef.current;
                setIsPlayingWhisper(false);
                
                trackWhisperEngagement({
                    characterName: experience.characterName,
                    trope: experience.trope,
                    listened: true,
                    listenDuration: duration,
                    replayed: false,
                    timestamp: Date.now()
                });
                
                console.log('✅ Whisper complete');
            };
            
            audio.onerror = () => {
                setIsPlayingWhisper(false);
                console.error('❌ Whisper playback error');
            };
            
            await audio.play();
            
        } catch (error) {
            console.error('❌ Whisper generation failed:', error);
            alert('Could not generate whisper. Check console for details.');
        } finally {
            setIsGeneratingWhisper(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black animate-slow-fade flex items-center justify-center overflow-hidden">
            
            {/* 1. THE CINEMATIC SUBJECT */}
            <div className="absolute inset-0 z-0">
                {privateImageUrl ? (
                    <img src={privateImageUrl} className="w-full h-full object-cover animate-slow-fade filter contrast-125 brightness-75 scale-105" alt="The Private Room" />
                ) : imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover animate-slow-fade brightness-90" alt={profile.name} />
                ) : (
                    <div className="w-full h-full bg-davinci-ink flex items-center justify-center">
                        <div className="w-12 h-12 border border-davinci-gold/20 border-t-davinci-gold rounded-full animate-spin"></div>
                    </div>
                )}
                {/* Visual Heartbeat Effect */}
                {(isLiveCalling || isPlayingWhisper) && <div className="absolute inset-0 bg-davinci-red/5 animate-pulse pointer-events-none"></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 opacity-90 pointer-events-none"></div>
            </div>

            {/* 2. THE STORY OVERLAYS */}
            <div className="absolute bottom-[20%] left-0 w-full px-12 text-center z-10">
                {isLiveCalling ? (
                    <div className="animate-slow-fade">
                        <p className="text-davinci-red tracking-[0.5em] uppercase text-[10px] mb-4 animate-pulse">Call In Progress</p>
                        <p className="text-2xl font-light italic text-white cinematic-shadow">"I can hear your breath..."</p>
                    </div>
                ) : isPlayingWhisper ? (
                    <div className="animate-slow-fade">
                        <p className="text-davinci-gold tracking-[0.5em] uppercase text-[10px] mb-4 animate-pulse">Whispering...</p>
                        <p className="text-2xl font-light italic text-white cinematic-shadow">"Close your eyes and listen..."</p>
                    </div>
                ) : activeBeat && (
                    <div className="animate-slow-fade" key={beatIndex}>
                         <div className="w-1 h-1 bg-davinci-gold/40 rounded-full mx-auto mb-6 animate-pulse"></div>
                         <p className="text-3xl font-light italic text-white cinematic-shadow leading-relaxed max-w-2xl mx-auto">
                            "{activeBeat.text}"
                         </p>
                    </div>
                )}
            </div>

            {/* 3. INTERFACE */}
            <div className="absolute top-0 left-0 w-full h-full z-20 p-12 flex flex-col justify-between pointer-events-none">
                
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-extralight italic">{profile.name}</h2>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-davinci-gold opacity-60">{profile.trope}</p>
                    </div>
                    <button onClick={onReset} className="opacity-30 hover:opacity-100 transition-opacity text-xs tracking-widest uppercase">Disconnect</button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-8 pointer-events-auto w-full">
                    
                    <div className="max-w-xs text-left">
                        {!isVaultUnlocked ? (
                            <div className="space-y-4">
                                <p className="font-handwriting text-3xl text-davinci-paper opacity-80 leading-snug">"He called you drunk last night..."</p>
                                <button onClick={handleUnlockBundle} className="group relative text-[10px] font-bold tracking-[0.4em] uppercase text-davinci-gold hover:text-white transition-colors flex items-center gap-2">
                                    <span className="relative z-10">Unlock The 3 AM Bundle</span>
                                    <span className="text-[8px] border border-davinci-gold/40 px-2 py-0.5 group-hover:border-white transition-colors">{ECONOMY_COSTS.UNLOCK_VAULT} Tribute</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4">
                                <button onClick={handlePlayVoicemail} className={`text-[10px] tracking-[0.4em] uppercase border border-white/20 px-6 py-4 transition-all ${isPlayingVoicemail ? 'bg-davinci-red text-white' : 'hover:bg-white hover:text-black'}`}>
                                    {isPlayingVoicemail ? 'Listening...' : 'Play Voicemail'}
                                </button>
                                <button onClick={() => setShowLetter(true)} className="text-[10px] tracking-[0.4em] uppercase border border-davinci-gold bg-davinci-gold/10 px-6 py-4 hover:bg-davinci-gold hover:text-black transition-all">
                                    Read Letter
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 flex-wrap justify-end">
                        {/* NEW: Whisper Button */}
                        <button 
                            onClick={handleWhisper}
                            disabled={isGeneratingWhisper || isPlayingWhisper}
                            className={`px-8 py-5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${
                                isPlayingWhisper 
                                    ? 'bg-purple-600 text-white animate-pulse' 
                                    : isGeneratingWhisper
                                    ? 'bg-purple-900 text-white opacity-50 cursor-wait'
                                    : 'bg-transparent border border-purple-400 text-purple-300 hover:bg-purple-500 hover:text-white'
                            }`}
                        >
                            {isGeneratingWhisper ? (
                                <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : isPlayingWhisper ? (
                                <>
                                    🎧 Listening...
                                </>
                            ) : (
                                <>
                                    🎧 Hear Him Whisper
                                </>
                            )}
                        </button>

                        <button 
                            onClick={handleStartLiveCall} 
                            className={`px-8 py-5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${isLiveCalling ? 'bg-davinci-red text-white animate-pulse' : 'bg-transparent border border-white/20 text-white hover:bg-white/10'}`}
                        >
                            {isLiveCalling ? (
                                <>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-3 bg-white animate-[bounce_1s_infinite]"></div>
                                        <div className="w-1 h-3 bg-white animate-[bounce_1s_infinite_0.2s]"></div>
                                        <div className="w-1 h-3 bg-white animate-[bounce_1s_infinite_0.4s]"></div>
                                    </div>
                                    End Call
                                </>
                            ) : 'Establish Connection'}
                        </button>
                        
                        <button onClick={() => setChatOpen(true)} className="bg-white text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-davinci-gold transition-colors">Speak to Him</button>
                    </div>
                </div>
            </div>

            {/* 4. MODALS */}
            {showLetter && profile.loveLetterText && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 animate-slow-fade" onClick={() => setShowLetter(false)}>
                    <div className="max-w-md w-full bg-[#fdfbf7] p-12 shadow-2xl transform rotate-1 relative" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                        <h3 className="font-handwriting text-4xl text-davinci-ink mb-8">My Dearest,</h3>
                        <p className="font-handwriting text-2xl leading-relaxed text-davinci-ink mb-12 opacity-90">
                            {profile.loveLetterText}
                        </p>
                        <p className="font-handwriting text-4xl text-right text-davinci-ink">- {profile.name}</p>
                    </div>
                </div>
            )}

            {chatOpen && <ChatInterface persona={{ name: profile.name, bio: `He is ${profile.trope}. ${profile.visualDescription}`, archetype: profile.trope }} onClose={() => setChatOpen(false)} />}
        </div>
    );
};

export default FantasyDashboard;