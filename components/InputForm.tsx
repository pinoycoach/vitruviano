
import React, { useState } from 'react';
import { TropeType, VISUAL_ARCHETYPES, DirectorInput } from '../types';

interface InputFormProps {
  onSubmit: (data: DirectorInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<DirectorInput>({
    name: '',
    trope: TropeType.THE_BILLIONAIRE,
    archetype: VISUAL_ARCHETYPES[0].id,
    vibe: 'Dark & Possessive'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-black border border-davinci-gold/30 p-8 rounded-xs shadow-2xl relative overflow-hidden animate-fade-in">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-20 text-davinci-gold text-4xl font-serif">DIRECTOR MODE</div>
      
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-davinci-paper">The Writers Room</h2>
        <p className="text-xs font-mono text-davinci-gold uppercase tracking-widest mt-1">Cast Your Leading Man</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. NAME & VIBE */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Character Name</label>
                <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Killian"
                    required
                    className="w-full bg-white/5 border border-white/20 p-3 text-white font-serif placeholder:opacity-30 focus:border-davinci-gold outline-hidden transition-colors"
                />
            </div>
             <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Tonal Frequency</label>
                <select 
                    value={formData.vibe}
                    onChange={(e) => setFormData({...formData, vibe: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 p-3 text-white font-sans text-sm focus:border-davinci-gold outline-hidden"
                >
                    <option>Dark & Possessive</option>
                    <option>Soft & Devoted</option>
                    <option>Funny & Chaotic</option>
                    <option>Enemies to Lovers (High Friction)</option>
                    <option>Slow Burn (Intense)</option>
                </select>
            </div>
        </div>

        {/* 2. THE TROPE (PLOT) */}
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Select Plot Archetype</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar border border-white/10 p-2">
                {Object.values(TropeType).map((trope) => (
                    <button
                        key={trope}
                        type="button"
                        onClick={() => setFormData({...formData, trope})}
                        className={`text-left px-4 py-3 text-sm transition-all border-l-2 ${
                            formData.trope === trope 
                            ? 'border-davinci-red bg-white/10 text-white font-bold' 
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {trope}
                    </button>
                ))}
            </div>
        </div>

        {/* 3. VISUAL ARCHETYPE (AESTHETIC) */}
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Visual Aesthetic</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VISUAL_ARCHETYPES.map((arch) => (
                    <button
                        key={arch.id}
                        type="button"
                        onClick={() => setFormData({...formData, archetype: arch.id})}
                        className={`relative p-3 border transition-all text-left group ${
                            formData.archetype === arch.id
                            ? 'border-davinci-gold bg-davinci-gold/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className={`text-sm font-serif font-bold mb-1 ${formData.archetype === arch.id ? 'text-davinci-gold' : 'text-gray-300'}`}>
                            {arch.label}
                        </div>
                        <div className="text-[9px] text-gray-500 leading-tight">
                            {arch.desc}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-davinci-red text-white font-bold uppercase tracking-[0.2em] py-5 hover:bg-red-900 transition-all shadow-[0_0_20px_rgba(139,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
        >
            <span className="relative z-10">{isLoading ? 'Casting...' : 'ACTION'}</span>
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
        </button>

      </form>
    </div>
  );
};

export default InputForm;
