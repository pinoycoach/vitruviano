
import React, { useState } from 'react';

interface ManifestorFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const ManifestorForm: React.FC<ManifestorFormProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length > 10) onSubmit(text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-12 animate-slow-fade">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-extralight italic mb-4">The Invocation</h2>
        <p className="text-[10px] font-light text-davinci-gold uppercase tracking-[0.5em]">Manifest Your Obsession</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="relative">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us about him... describe his eyes, the way he looks at you, the secrets he keeps."
            required
            className="w-full h-64 bg-transparent border-b border-davinci-gold/20 py-4 text-2xl font-extralight italic text-white placeholder:opacity-20 focus:border-davinci-gold outline-hidden transition-all resize-none leading-relaxed"
          />
          <div className="absolute bottom-4 right-0 text-[10px] tracking-[0.2em] opacity-40 uppercase">
              He's listening.
          </div>
        </div>

        <button
            type="submit"
            disabled={isLoading || text.length < 10}
            className="w-full bg-davinci-gold text-black font-bold uppercase tracking-[0.5em] py-8 hover:bg-white transition-all transform hover:scale-[1.02] disabled:opacity-20 relative group overflow-hidden"
        >
            <span className="relative z-10">{isLoading ? 'Manifesting...' : 'AWAKEN REALITY'}</span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>
      </form>
    </div>
  );
};

export default ManifestorForm;
