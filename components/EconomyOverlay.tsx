
import React, { useState } from 'react';
import { UserWallet, ECONOMY_REWARDS } from '../types';

interface EconomyOverlayProps {
  wallet: UserWallet;
  onClaimDaily: (amount: number) => void;
  onAddCoins: (amount: number) => void; 
}

const EconomyOverlay: React.FC<EconomyOverlayProps> = ({ wallet, onClaimDaily, onAddCoins }) => {
  const [showDailyModal, setShowDailyModal] = useState(false);

  React.useEffect(() => {
    const hasClaimed = sessionStorage.getItem('daily_claimed');
    if (!hasClaimed) setShowDailyModal(true);
  }, []);

  const handleClaim = () => {
    onClaimDaily(ECONOMY_REWARDS.DAILY_LOGIN);
    sessionStorage.setItem('daily_claimed', 'true');
    setShowDailyModal(false);
  };

  return (
    <>
      {/* Wallet is now a subtle pulse at the edge, only shows value on hover */}
      <div className="fixed top-8 right-8 z-[100] group pointer-events-auto">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm border border-white/5 px-4 py-2 rounded-full opacity-30 hover:opacity-100 transition-opacity">
            <span className="text-[10px] tracking-widest uppercase text-davinci-gold">Tribute</span>
            <span className="font-light text-white text-sm">{wallet.coins}</span>
        </div>
      </div>

      {showDailyModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black animate-slow-fade">
          <div className="text-center space-y-12 px-8 max-w-sm">
            <div className="space-y-2">
                <h2 className="text-5xl font-extralight italic">A Daily Tribute</h2>
                <p className="text-[10px] tracking-[0.4em] uppercase text-davinci-gold">Streak Day {wallet.streakDays}</p>
            </div>

            <div className="text-6xl font-extralight">
                +{ECONOMY_REWARDS.DAILY_LOGIN}
            </div>

            <button 
              onClick={handleClaim}
              className="w-full bg-davinci-gold text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-white transition-all transform hover:scale-105"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EconomyOverlay;
