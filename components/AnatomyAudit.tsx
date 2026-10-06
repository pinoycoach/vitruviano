import React from 'react';

interface AuditProps {
  imageUrl: string;
  proportions: {
    headToBody: number; // Goal: 8.0
    apeIndex: number;   // Goal: 1.0
    centerOffset: number; // Goal: 0 (exactly 50%)
  };
}

const AnatomyAudit: React.FC<AuditProps> = ({ imageUrl, proportions }) => {
  // Defensive defaults in case data is missing/undefined
  const headVal = proportions?.headToBody ?? 8.0;
  const apeVal = proportions?.apeIndex ?? 1.0;
  const centerVal = proportions?.centerOffset ?? 0;

  // Determine compliance based on Da Vinci's tolerances
  // We allow a small deviation before flagging it as "Modified Humanity"
  const isPerfect = 
    Math.abs(headVal - 8.0) < 0.3 && 
    Math.abs(apeVal - 1.0) < 0.05;

  return (
    <div className="relative w-full max-w-[500px] mx-auto border-2 border-davinci-gold rounded-xs overflow-hidden bg-davinci-ink shadow-2xl group cursor-crosshair">
      {/* 1. THE GENERATED MODEL */}
      <img 
        src={imageUrl} 
        alt="Generated Vitruvian DNA" 
        className="w-full h-auto opacity-90 transition-opacity duration-700 group-hover:opacity-100" 
      />

      {/* 2. THE VITRUVIAN OVERLAY (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" viewBox="0 0 100 100">
        {/* The Square (The Physical World) */}
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(212, 175, 55, 0.5)" strokeWidth="0.4" />
        
        {/* The Circle (The Spiritual/Aesthetic) */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="0.4" />

        {/* The 8-Head Grid Lines (Y-Axis Segmentation) */}
        {[...Array(8)].map((_, i) => (
          <line 
            key={i} 
            x1="5" y1={5 + (i * 11.25)} x2="95" y2={5 + (i * 11.25)} 
            stroke="rgba(255,255,255,0.15)" strokeWidth="0.1" 
          />
        ))}

        {/* The Center Point Marker (Genitals/Center - The Conundrum Solution) */}
        <line x1="5" y1="50" x2="95" y2="50" stroke="#D4AF37" strokeWidth="0.6" strokeDasharray="1,2" />
        
        {/* Vertical Axis */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="#D4AF37" strokeWidth="0.2" strokeDasharray="2,2" />

        {/* Dynamic Data Points on Hover */}
        <circle cx="50" cy="16.25" r="0.5" fill="#D4AF37" className="animate-pulse" /> {/* Chin */}
        <circle cx="50" cy="50" r="0.8" fill="#8B0000" className="animate-ping" />   {/* Center */}
      </svg>

      {/* 3. THE HUD (Heads-Up Display) */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-sm border border-davinci-gold/50 text-[10px] font-mono text-davinci-gold shadow-lg transform transition-transform duration-300 hover:scale-105">
        <div className="flex items-center justify-between border-b border-davinci-gold/30 pb-1 mb-2 space-x-4">
            <span className="font-bold tracking-widest">NEXUS AUDIT</span>
            <div className={`w-2 h-2 rounded-full ${isPerfect ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"}`}></div>
        </div>
        
        <div className="space-y-1">
            <p className="flex justify-between space-x-4">
                <span className="opacity-70">STATUS:</span>
                <span className={isPerfect ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                    {isPerfect ? "VITRUVIAN" : "MODIFIED"}
                </span>
            </p>
            <p className="flex justify-between">
                <span className="opacity-70">HEAD RATIO:</span>
                <span>1:{headVal.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
                <span className="opacity-70">APE INDEX:</span>
                <span>{apeVal.toFixed(3)}</span>
            </p>
            <p className="flex justify-between">
                <span className="opacity-70">CENTER BIAS:</span>
                <span>{centerVal.toFixed(1)}%</span>
            </p>
        </div>
      </div>
      
      {/* Scan Line Animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-davinci-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-[scan_4s_ease-in-out_infinite] pointer-events-none"></div>
      <style>{`
        @keyframes scan {
            0%, 100% { top: 5%; opacity: 0; }
            10% { opacity: 1; }
            50% { top: 95%; opacity: 1; }
            90% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AnatomyAudit;