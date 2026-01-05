import React, { useState, useEffect } from 'react';

const steps = [
  "INITIALIZING VITRUVIAN CORE...",
  "ACCESSING BIOMETRIC DATABASE...",
  "CALIBRATING 8-HEAD SKELETAL RATIO...",
  "INJECTING CHOSEN HERITAGE TOKENS...",
  "APPLYING ARCHETYPE ENERGY: [ACTIVE]",
  "SIMULATING FABRIC PHYSICS...",
  "RENDERING SWEAT GLAZE & MICRO-TEXTURES...",
  "DEVELOPING 35MM FILM (ILFORD HP5)...",
  "FINALIZING AESTHETIC COMPLIANCE...",
  "ASSET GENERATION COMPLETE."
];

const TerminalLoader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1200); // 1.2s per step = ~12s total (aligns with GenAI latency)
      return () => clearTimeout(timeout);
    }
  }, [currentStep]);

  return (
    <div className="w-full h-[400px] bg-black border-2 border-davinci-gold p-6 font-mono text-xs md:text-sm overflow-hidden relative shadow-2xl flex flex-col justify-end">
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
      
      <div className="absolute top-4 right-4 text-davinci-gold animate-pulse">
        NEXUS 3.0 // PROCESSOR ACTIVE
      </div>

      <div className="space-y-2 z-10">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`${index === currentStep ? "text-white" : index < currentStep ? "text-davinci-gold opacity-50" : "opacity-0"} transition-all duration-300 flex items-center`}
          >
            <span className="mr-2">
              {index < currentStep ? "✓" : index === currentStep ? ">" : " "}
            </span>
            {step}
            {index === currentStep && (
              <span className="inline-block w-2 h-4 bg-davinci-red ml-2 animate-pulse"></span>
            )}
          </div>
        ))}
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-davinci-gold/10 rounded-full animate-[spin_10s_linear_infinite] z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-davinci-red/10 rounded-full animate-[spin_15s_linear_infinite_reverse] z-0"></div>
    </div>
  );
};

export default TerminalLoader;