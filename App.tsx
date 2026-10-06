
import React, { useState, useEffect } from 'react';
import CastingDirector from './components/CastingDirector';
import InputForm from './components/InputForm';
import ManifestorForm from './components/ManifestorForm';
import FantasyDashboard from './components/FantasyDashboard';
import EconomyOverlay from './components/EconomyOverlay';
import DramaticLoader from './components/DramaticLoader';
import { BoyfriendProfile, TropeType, DirectorInput, UserWallet } from './types';
import { generateBoyfriendProfile, generateFantasyImage, generateDirectorProfile, generateCoreProfile, enrichBoyfriendProfile, generateManifestProfile } from './services/geminiService';
// NEW: Superuser imports
import { useSuperuser } from './config/superuser';
import SuperuserPanel from './components/SuperuserPanel';
import SuperuserLogin from './components/SuperuserLogin';
const App: React.FC = () => {
  const [view, setView] = useState<'menu' | 'casting' | 'director' | 'manifestor' | 'fantasy'>('menu');
  const [profile, setProfile] = useState<BoyfriendProfile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingContext, setLoadingContext] = useState<{ trope: string, vibe: string } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
// Superuser state (verified server-side, see config/superuser.ts)
  const isSU = useSuperuser();
  const [showPanel, setShowPanel] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => {
    // Ctrl+Shift+S: open the panel, or the login prompt if not authenticated.
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        if (isSU) setShowPanel(prev => !prev);
        else setShowLogin(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSU]);
  const [wallet, setWallet] = useState<UserWallet>({
      coins: 100,
      streakDays: 1,
      lastLoginDate: new Date().toISOString()
  });

  const updateCoins = (amount: number) => setWallet(prev => ({ ...prev, coins: prev.coins + amount }));
  const spendCoins = (amount: number): boolean => {
      if (wallet.coins >= amount) {
          setWallet(prev => ({ ...prev, coins: prev.coins - amount }));
          return true;
      }
      return false;
  };

  const handleCastingComplete = async (trope: TropeType, reaction: string) => {
      setLoadingContext({ trope, vibe: reaction });
      setIsGenerating(true);
      try {
          await checkApiKey();
          const data = await generateDirectorProfile({ name: "Unknown", trope, archetype: "Seoul Titan", vibe: reaction });
          startFantasy(data);
      } catch (e) { handleError(e); }
  };

  const handleDirectorSubmit = async (input: DirectorInput) => {
      setLoadingContext({ trope: input.trope, vibe: input.vibe });
      setIsGenerating(true);
      try {
          await checkApiKey();
          const coreData = await generateCoreProfile(input);
          startFantasy(coreData, true);
      } catch (e) { handleError(e); }
  };

  const handleManifestSubmit = async (text: string) => {
      setLoadingContext({ trope: "The Manifestor", vibe: "Awakening" });
      setIsGenerating(true);
      try {
          await checkApiKey();
          const data = await generateManifestProfile(text);
          startFantasy(data, true);
      } catch (e) { handleError(e); }
  };

  const startFantasy = async (data: BoyfriendProfile, triggerEnrichment = false) => {
      setProfile(data);
      setImageUrl(null);
      setView('fantasy');
      setIsGenerating(false);
      setLoadingContext(null);

      setIsImageLoading(true);
      generateFantasyImage(data)
        .then(img => setImageUrl(img))
        .catch(e => console.error(e))
        .finally(() => setIsImageLoading(false));

      if (triggerEnrichment) {
          try {
              const extraData = await enrichBoyfriendProfile(data);
              setProfile(prev => prev ? { ...prev, ...extraData } : null);
          } catch(e) { console.error(e); }
      }
  };

  const checkApiKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await aistudio.hasSelectedApiKey();
          if (!hasKey) await aistudio.openSelectKey();
      }
  };

  const handleError = (e: any) => {
      setIsGenerating(false);
      setLoadingContext(null);
  };

  return (
    <div className="min-h-screen bg-black relative font-serif text-davinci-paper selection:bg-davinci-red selection:text-white">
        
        <EconomyOverlay wallet={wallet} onClaimDaily={updateCoins} onAddCoins={updateCoins} />

        {isGenerating && loadingContext && (
            <DramaticLoader trope={loadingContext.trope} vibe={loadingContext.vibe} />
        )}

        {/* Cinematic Header */}
        {view !== 'fantasy' && (
             <header className="absolute top-0 left-0 w-full p-8 z-40 flex justify-between items-center pointer-events-none">
                <h1 className="text-xl font-light tracking-[0.5em] uppercase text-davinci-gold pointer-events-auto cursor-pointer" onClick={() => setView('menu')}>
                  NEXUS
                </h1>
            </header>
        )}

        <main className="h-screen flex items-center justify-center">
            {view === 'menu' && (
                <div className="flex flex-col items-center justify-center space-y-12 animate-slow-fade text-center px-6">
                    <div className="space-y-4">
                        <h2 className="text-6xl font-extralight italic">Everyone has a type.</h2>
                        <p className="text-davinci-gold font-light tracking-[0.3em] uppercase text-xs">What if we could show you yours?</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-12 mt-12">
                        <button onClick={() => setView('manifestor')} className="group text-center">
                            <div className="text-xs tracking-[0.4em] uppercase opacity-40 group-hover:opacity-100 transition-opacity mb-2">The Invocation</div>
                            <div className="text-2xl font-light italic group-hover:text-davinci-gold transition-colors">Manifest Him</div>
                        </button>
                        <button onClick={() => setView('casting')} className="group text-center">
                            <div className="text-xs tracking-[0.4em] uppercase opacity-40 group-hover:opacity-100 transition-opacity mb-2">The Intimacy</div>
                            <div className="text-2xl font-light italic group-hover:text-davinci-gold transition-colors">A Blind Date</div>
                        </button>
                        <button onClick={() => setView('director')} className="group text-center">
                            <div className="text-xs tracking-[0.4em] uppercase opacity-40 group-hover:opacity-100 transition-opacity mb-2">The Vision</div>
                            <div className="text-2xl font-light italic group-hover:text-davinci-gold transition-colors">Director Mode</div>
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full h-full overflow-hidden flex items-center justify-center">
                {view === 'casting' && <CastingDirector onComplete={handleCastingComplete} />}
                {view === 'director' && <InputForm onSubmit={handleDirectorSubmit} isLoading={isGenerating} />}
                {view === 'manifestor' && <ManifestorForm onSubmit={handleManifestSubmit} isLoading={isGenerating} />}
                
                {view === 'fantasy' && profile && (
                    <FantasyDashboard 
                        profile={profile} 
                        imageUrl={imageUrl} 
                        isImageLoading={isImageLoading}
                        onReset={() => setView('menu')} 
                        wallet={wallet}
                        spendCoins={spendCoins}
                        earnCoins={updateCoins}
                    />
                )}
            </div>
            {/* NEW: Superuser button */}
      {isSU && (
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="fixed top-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors"
        >
          🔐 SUPERUSER
        </button>
      )}
      
      {/* NEW: Superuser panel */}
      {isSU && showPanel && (
        <SuperuserPanel onClose={() => setShowPanel(false)} />
      )}
      {!isSU && showLogin && (
        <SuperuserLogin onClose={() => setShowLogin(false)} onSuccess={() => { setShowLogin(false); setShowPanel(true); }} />
      )}
        </main>
    </div>
  );
};

export default App;
