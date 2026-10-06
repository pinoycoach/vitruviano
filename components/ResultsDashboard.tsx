import React, { useState, useEffect, useRef } from 'react';
import { BodyMeasurements, RatioAnalysis, AiInsight, GeneratedImage, ComplianceAudit } from '../types';
import { generateCsvContent } from '../services/calculationService';
import { validateVitruvianCompliance, generateVoiceLine, playRawAudio, estimateRequestCost, getVoicePersonality } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import AnatomyAudit from './AnatomyAudit';
import TerminalLoader from './TerminalLoader';
import ChatInterface from './ChatInterface';

interface ResultsDashboardProps {
  measurements: BodyMeasurements;
  analysis: RatioAnalysis;
  insight: AiInsight | null;
  generatedImage: GeneratedImage | null;
  isGeneratingImage: boolean;
  onReset: () => void;
  onGenerateImage: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
    measurements, 
    analysis, 
    insight, 
    generatedImage, 
    isGeneratingImage,
    onReset,
    onGenerateImage
}) => {
  
  const [auditResult, setAuditResult] = useState<ComplianceAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'metrics'>('profile');
  const [showChat, setShowChat] = useState(false);
  
  // Voice State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceData, setVoiceData] = useState<string | null>(null);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  
  // Book Excerpt State
  const [isReadingBook, setIsReadingBook] = useState(false);
  const [bookAudioData, setBookAudioData] = useState<string | null>(null);
  
  // Cost Tracking
  const [sessionCost, setSessionCost] = useState({ tokens: 0, costUSD: 0 });

  useEffect(() => {
     // Initial Cost of the Analysis
     const cost = estimateRequestCost('text', 800); // Analysis prompt
     updateCost(cost.tokens, cost.costUSD);
  }, [insight]);

  const updateCost = (tokens: number, usd: number) => {
      setSessionCost(prev => ({
          tokens: prev.tokens + tokens,
          costUSD: prev.costUSD + usd
      }));
  };

  // Trigger Audit when a new image is generated
  useEffect(() => {
    if (generatedImage?.url) {
        setIsAuditing(true);
        validateVitruvianCompliance(generatedImage.url)
            .then(result => setAuditResult(result))
            .catch(err => console.error(err))
            .finally(() => setIsAuditing(false));
        
        // Add Image Cost
        const cost = estimateRequestCost('image', 1);
        updateCost(cost.tokens, cost.costUSD);
    } else {
        setAuditResult(null);
    }
  }, [generatedImage]);

  const handleVoicePlay = async () => {
      if (voiceData) {
          setIsPlayingVoice(true);
          try {
            await playRawAudio(voiceData);
          } catch(e) { console.error(e); }
          setIsPlayingVoice(false);
          return;
      }

      if (!insight?.romanceHook) return;

      setIsGeneratingVoice(true);
      try {
          const cost = estimateRequestCost('audio', insight.romanceHook.length);
          updateCost(cost.tokens, cost.costUSD);

          const base64 = await generateVoiceLine(insight.romanceHook, analysis.archetype);
          setVoiceData(base64);
          
          setIsPlayingVoice(true);
          await playRawAudio(base64);
          setIsPlayingVoice(false);
      } catch (e) {
          console.error("Voice Generation Failed", e);
          alert("Audio protocols unavailable. Please verify API configuration.");
      } finally {
          setIsGeneratingVoice(false);
      }
  };

  const handleBookRead = async () => {
      if (bookAudioData) {
          setIsReadingBook(true);
          try {
             await playRawAudio(bookAudioData);
          } catch(e) { console.error(e); }
          setIsReadingBook(false);
          return;
      }

      if (!insight?.bookRecommendation?.excerpt) return;

      setIsReadingBook(true);
      try {
           const cost = estimateRequestCost('audio', insight.bookRecommendation.excerpt.length);
           updateCost(cost.tokens, cost.costUSD);

           const base64 = await generateVoiceLine(insight.bookRecommendation.excerpt, analysis.archetype);
           setBookAudioData(base64);

           await playRawAudio(base64);
      } catch(e) {
          console.error("Book Reading Failed", e);
      } finally {
          setIsReadingBook(false);
      }
  };

  const downloadCsv = () => {
    const csvContent = generateCsvContent(measurements, analysis);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vitruvian_dna_${measurements.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data
  const chartData = [
    {
      subject: 'Ape Index',
      User: Math.min(120, ((analysis.apeIndex || 1.0) / 1.0) * 100),
      Vitruvian: 100,
      ModernHeroic: 105,
      fullMark: 120,
    },
    {
      subject: 'Head Scale',
      User: Math.min(120, ((analysis.headRatio || 8.0) / 8.0) * 100),
      Vitruvian: 100,
      ModernHeroic: 106, 
      fullMark: 120,
    },
    {
      subject: 'Symmetry',
      User: analysis.vitruvianScore,
      Vitruvian: 100,
      ModernHeroic: 90, 
      fullMark: 100,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-fade-in relative">
      
      {/* 2026 VISION: THE "ENTITY" HEADER */}
      <div className="flex flex-col items-center mb-8 border-b border-davinci-gold/20 pb-6 relative">
        <h2 className="text-5xl font-serif text-davinci-ink mb-1">{insight?.title || measurements.name}</h2>
        <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest text-davinci-red">
            <span>{analysis.archetype}</span>
            <span className="text-davinci-gold">•</span>
            <span>{insight?.marketValue || "ANALYZING VALUE..."}</span>
        </div>
        
        {/* TOKEN COST TRACKER (TRANSPARENCY ENGINE) */}
        <div className="absolute top-0 right-0 hidden md:block text-right">
            <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Generative Cost</div>
            <div className="text-xs font-mono text-davinci-ink">
                {sessionCost.tokens.toLocaleString()} Tokens
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-davinci-gold">${sessionCost.costUSD.toFixed(5)}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: THE VISUAL (THE HOOK) - 5 COLS */}
        <div className="lg:col-span-5 space-y-6">
             <div className="bg-davinci-paper border border-davinci-gold p-2 shadow-2xl relative flex flex-col items-center">
                {isGeneratingImage ? (
                    <TerminalLoader />
                ) : !generatedImage ? (
                    <div className="aspect-[3/4] w-full bg-davinci-ink/5 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-davinci-ink/10">
                        <p className="font-serif italic text-gray-500 mb-4">"The soul is ready. The body awaits construction."</p>
                        <button 
                            onClick={onGenerateImage}
                            className="bg-davinci-red text-white px-8 py-4 uppercase tracking-[0.2em] font-bold shadow-xl hover:bg-black transition-all transform hover:scale-105"
                        >
                            Manifest Entity
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        <div className="relative group w-full max-w-[500px]">
                            <AnatomyAudit 
                                imageUrl={generatedImage.url}
                                proportions={{
                                    headToBody: auditResult?.headRatio ?? analysis.headRatio ?? 8.0,
                                    apeIndex: auditResult?.apeIndex ?? analysis.apeIndex ?? 1.0,
                                    centerOffset: auditResult?.centerOffset ?? ((100 - (analysis.vitruvianScore || 0)) / 4)
                                }}
                            />
                            {/* MONETIZATION TEASE: LOCKED GALLERY */}
                            <div className="absolute top-4 right-4 flex space-x-2 z-20">
                                <div className="w-10 h-14 bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-not-allowed group/lock hover:bg-davinci-red transition-colors shadow-lg" title="Unlock Raw Mode">
                                    <span className="text-lg grayscale group-hover/lock:grayscale-0">🔒</span>
                                </div>
                            </div>
                        </div>

                        {/* DOWNLOAD & SHARE ACTION BAR */}
                        <div className="w-full max-w-[500px] flex justify-between items-center mt-3 border-t border-davinci-gold/20 pt-3">
                             <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                                Nexus 3.0 Asset // {analysis.archetype.split(' ')[1] || 'GENESIS'}
                             </div>
                             <a 
                                href={generatedImage.url} 
                                download={`nexus_model_${measurements.name.replace(/\s+/g, '_')}.png`}
                                className="bg-davinci-ink text-davinci-gold px-5 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-black transition-all shadow-md flex items-center gap-2 group/btn"
                            >
                                <span>Save to Device</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3.25-3.25m3.25 3.25l3.25-3.25M12 12.75V3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                )}
             </div>

             {/* THE SHOPPING LIST (COMMERCE PIVOT) - ENHANCED UI */}
             {insight?.shoppingList && (
                <div className="bg-white border border-gray-200 p-4 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-davinci-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400 relative z-10">Shop This Aesthetic</h3>
                    <div className="space-y-3 relative z-10">
                        {insight.shoppingList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-sm transition-colors border border-transparent hover:border-gray-100">
                                <div>
                                    <div className="font-serif text-lg leading-none group-hover:text-davinci-red transition-colors">{item.brand}</div>
                                    <div className="text-xs text-gray-500">{item.item}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-xs font-bold font-mono text-gray-600">
                                        {item.price}
                                    </div>
                                    <button className="bg-black text-white text-[8px] uppercase px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        BUY
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
        </div>

        {/* RIGHT COLUMN: THE NARRATIVE (THE RETENTION) - 7 COLS */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* TAB SYSTEM */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-6 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'profile' ? 'border-b-2 border-davinci-red text-davinci-ink' : 'text-gray-400 hover:text-davinci-ink'}`}
                >
                    Persona ID
                </button>
                <button 
                    onClick={() => setActiveTab('metrics')}
                    className={`pb-3 px-6 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'metrics' ? 'border-b-2 border-davinci-red text-davinci-ink' : 'text-gray-400 hover:text-davinci-ink'}`}
                >
                    Biometrics
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                    {/* DATING BIO (ROMANCE PIVOT) */}
                    <div className="bg-white p-8 shadow-lg border-l-4 border-davinci-gold relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl font-serif">"</span>
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Voice / Personality Matrix</h3>
                        <p className="font-serif text-xl italic leading-relaxed text-davinci-ink">
                            {insight?.datingBio || "Analyzing personality constructs..."}
                        </p>
                        
                        {/* 2026 PIVOT: ROMANCE NOVEL HOOK */}
                        {insight?.romanceHook && (
                             <div className="mt-4 p-4 bg-davinci-paper/50 border border-davinci-gold/20 rounded-xs">
                                 <div className="flex justify-between items-center mb-1">
                                    <p className="font-mono text-[10px] text-davinci-red uppercase tracking-widest">Generated Audio Hook (Mills & Boon Protocol)</p>
                                    <p className="font-mono text-[9px] text-gray-500 uppercase">{getVoicePersonality(analysis.archetype)}</p>
                                 </div>
                                 <p className="font-serif italic text-gray-500 mb-3">"{insight.romanceHook}"</p>
                             </div>
                        )}

                        <div className="mt-6 flex space-x-4">
                            <button 
                                onClick={() => setShowChat(true)}
                                className="bg-black text-white px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-davinci-red transition-all shadow-lg flex items-center gap-2"
                            >
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Chat with {measurements.name}
                            </button>
                            
                            {/* VOICE NOTE BUTTON (UNLOCKED) */}
                            <button 
                                onClick={handleVoicePlay}
                                disabled={isGeneratingVoice}
                                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 border ${
                                    isPlayingVoice 
                                    ? 'bg-davinci-red text-white border-davinci-red animate-pulse' 
                                    : 'bg-white text-davinci-ink border-davinci-gold hover:bg-davinci-paper'
                                }`}
                            >
                                {isGeneratingVoice ? (
                                    <span>Synthesizing Voice...</span>
                                ) : isPlayingVoice ? (
                                    <>
                                        <span>Playing...</span>
                                        <div className="flex gap-0.5 h-3 items-end">
                                            <div className="w-0.5 bg-white animate-[bounce_1s_infinite] h-2"></div>
                                            <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.2s] h-3"></div>
                                            <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.4s] h-1"></div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span>Play Voice Note</span>
                                        <span className="text-lg">▶️</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* NEW: LITERARY SEDUCTION (AFFILIATE ENGINE) */}
                    {insight?.bookRecommendation && (
                        <div className="bg-gradient-to-r from-davinci-ink to-gray-900 p-6 text-davinci-paper border border-davinci-gold relative overflow-hidden">
                             <div className="absolute top-0 right-0 opacity-10 font-serif text-9xl italic leading-none -mt-8 -mr-4">
                                &
                             </div>
                             <div className="relative z-10 flex flex-col md:flex-row gap-6">
                                 <div className="grow">
                                     <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-davinci-gold mb-1">
                                        Literary Archetype Match
                                     </h3>
                                     <h4 className="text-2xl font-serif mb-2">{insight.bookRecommendation.title}</h4>
                                     <p className="text-xs italic opacity-80 mb-4">by {insight.bookRecommendation.author}</p>
                                     <p className="text-sm font-serif mb-4 leading-relaxed opacity-90 border-l-2 border-davinci-red pl-3">
                                         {insight.bookRecommendation.whyItFits}
                                     </p>
                                     <div className="flex space-x-3">
                                         <a 
                                            href={`https://www.amazon.com/s?k=${encodeURIComponent(insight.bookRecommendation.amazonQuery)}&tag=vitruviandna-20`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-davinci-gold text-black px-4 py-2 text-xs font-bold uppercase hover:bg-white transition-colors flex items-center gap-2"
                                         >
                                             <span>Buy on Amazon</span>
                                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6v-2l-10 10 10 10v-2l-6-8 6-8zm4 14v2l10-10-10-10v2l6 8-6 8z"/></svg>
                                         </a>
                                         <button 
                                            onClick={handleBookRead}
                                            disabled={isReadingBook}
                                            className="border border-white/30 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-white/10 transition-colors flex items-center gap-2"
                                         >
                                             {isReadingBook ? (
                                                 <span className="animate-pulse">Reading Excerpt...</span>
                                             ) : (
                                                 <>
                                                     <span>Hear Excerpt</span>
                                                     <span>🎧</span>
                                                 </>
                                             )}
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* CRITIQUE CARD */}
                    <div className="bg-davinci-paper/50 p-6 border border-davinci-ink/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-davinci-red mb-2">The Aesthetic Critique</h3>
                        <p className="font-serif text-gray-800 mb-4">{insight?.critique}</p>
                        <div className="flex items-start space-x-2 text-sm bg-white p-3 border border-davinci-gold/30">
                            <span className="text-davinci-gold text-lg">✦</span>
                            <span className="font-mono text-gray-600">{insight?.advice}</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'metrics' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        {/* SCORECARD */}
                        <div className="bg-white p-6 border border-gray-200 text-center">
                            <span className="block text-xs font-bold uppercase text-gray-400">Vitruvian Score</span>
                            <span className="block text-5xl font-serif text-davinci-ink my-2">{analysis.vitruvianScore}</span>
                            <span className="block text-xs text-green-600 font-bold">Top 5% Genetic Potential</span>
                        </div>
                         <div className="bg-white p-6 border border-gray-200 text-center">
                            <span className="block text-xs font-bold uppercase text-gray-400">Ape Index</span>
                            <span className="block text-5xl font-serif text-davinci-ink my-2">{(analysis.apeIndex || 1).toFixed(3)}</span>
                            <span className="block text-xs text-davinci-gold font-bold">Ideal: 1.000</span>
                        </div>
                    </div>
                    
                    {/* RADAR CHART */}
                    <div className="bg-white p-4 border border-gray-200 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#2C2C2C', fontFamily: 'serif', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 130]} tick={false} axisLine={false} />
                                <Radar name="You" dataKey="User" stroke="#8B0000" strokeWidth={2} fill="#8B0000" fillOpacity={0.4} />
                                <Radar name="Vitruvian" dataKey="Vitruvian" stroke="#D4AF37" strokeDasharray="5 5" fill="transparent" />
                                <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '10px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <button 
                        onClick={downloadCsv}
                        className="w-full py-3 border border-davinci-ink text-davinci-ink uppercase text-xs font-bold hover:bg-davinci-ink hover:text-white transition-colors"
                    >
                        Export Biometric Data
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* FOOTER CTA (THE UPSELL) */}
      <div className="mt-12 bg-black text-white p-8 text-center">
          <h3 className="font-serif text-2xl mb-2 text-davinci-gold">Optimize Your Reality</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
              You have the blueprint. Now build the structure. Unlock your custom workout plan and grooming kit based on your DNA archetype.
          </p>
          <div className="flex justify-center space-x-4">
              <button onClick={onReset} className="text-xs uppercase font-bold tracking-widest text-gray-500 hover:text-white transition-colors">
                  Scan New Subject
              </button>
              <button className="bg-davinci-gold text-black px-6 py-2 text-xs uppercase font-bold tracking-widest hover:bg-white transition-colors">
                  Get The Protocol ($19.99)
              </button>
          </div>
      </div>
        
      {/* CHAT OVERLAY */}
      {showChat && insight && (
        <ChatInterface 
            persona={{
                name: measurements.name,
                bio: insight.datingBio,
                archetype: analysis.archetype
            }}
            onClose={() => setShowChat(false)}
        />
      )}

    </div>
  );
};

export default ResultsDashboard;