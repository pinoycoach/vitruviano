import React, { useState } from 'react';
import { clearSuperuser, isSuperuser } from '../config/superuser';
import { getEnabledFeatures } from '../config/features';

interface Props {
  onClose: () => void;
}

const SuperuserPanel: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'tools'>('info');
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-purple-500 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        
        <div className="bg-purple-600 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔐</span>
            <div>
              <h2 className="text-white font-bold text-xl">Superuser Control Panel</h2>
              <p className="text-purple-200 text-sm">You are in testing mode!</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-purple-700 px-4 py-2 rounded text-xl font-bold"
          >
            ✕
          </button>
        </div>
        
        <div className="flex border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-3 font-bold ${
              activeTab === 'info' 
                ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            INFO
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 px-6 py-3 font-bold ${
              activeTab === 'tools' 
                ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TOOLS
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
                <h3 className="text-green-400 font-bold mb-2 text-lg">SUCCESS!</h3>
                <p className="text-white">
                  Superuser mode is working! This panel is only visible to you.
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  Public users will NEVER see this panel or any experimental features.
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-purple-400 font-bold mb-3">What This Means:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>Your live app is still 100% safe for public</li>
                  <li>You can test new features here first</li>
                  <li>See analytics and cost data</li>
                  <li>Add features without breaking anything</li>
                </ul>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-purple-400 font-bold mb-3">How to Use:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>Click the button anytime to open this panel</li>
                  <li>Press keyboard shortcut to toggle panel</li>
                  <li>Test features in the TOOLS tab</li>
                  <li>Exit superuser mode when done testing</li>
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold mb-4 text-lg">Developer Tools</h3>
              
              <button 
                onClick={() => {
                  const features = getEnabledFeatures();
                  console.log('Enabled Features:', features);
                  alert('You have ' + (features?.length || 0) + ' features enabled! Check console for details.');
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3"
              >
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-bold">List Enabled Features</div>
                  <div className="text-purple-200 text-sm">See what features you have access to</div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  console.log('Superuser Status:', isSuperuser());
                  alert('Superuser status logged to console');
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3"
              >
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-bold">Check Superuser Status</div>
                  <div className="text-gray-300 text-sm">Verify you are in superuser mode</div>
                </div>
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const { generateBoyfriendImageCheap, getCostComparison } = await import('../services/falImageService');
                    
                    alert('Generating image...\n\nWill try fal.ai first ($0.008)\nIf no credits, falls back to Gemini ($0.039)');
                    
                    const result = await generateBoyfriendImageCheap(
                      'The Billionaire',
                      'Seoul Titan',
                      'Executive Office, Midnight, City Lights'
                    );
                    
                    const comparison = getCostComparison();
                    
                    console.log('Image Result:', result);
                    console.log('Cost Comparison:', comparison);
                    
                    window.open(result.url, '_blank');
                    
                    const usedService = result.usedFallback ? 'Gemini (fallback)' : 'fal.ai';
                    alert(`SUCCESS!\n\nService: ${usedService}\nCost: $${result.cost}\nModel: ${result.model}\n\nImage opened in new tab!`);
                  } catch (error: any) {
                    alert('Error: ' + error.message);
                    console.error('Image generation error:', error);
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3 transition-colors"
              >
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-bold">Test Smart Image Generation</div>
                  <div className="text-green-200 text-sm">Tries fal.ai first, falls back to Gemini automatically</div>
                </div>
              </button>
              
              <button 
                onClick={async () => {
  try {
    const { generateBoyfriendImageCheap, getCostComparison } = await import('../services/falImageService');
    
    const loadingAlert = 'Generating 9:16 vertical image...\n\nTrying fal.ai first ($0.008)\nFalls back to Gemini ($0.039)\n\nThis will take 10-15 seconds.';
    alert(loadingAlert);
    
    const result = await generateBoyfriendImageCheap(
      'The Billionaire',
      'Seoul Titan',
      'Executive Office, Midnight, City Lights'
    );
    
    const comparison = getCostComparison();
    
    console.log('✅ Image Result:', result);
    console.log('📊 Cost Comparison:', comparison);
    
    // Create new window with image
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Generated Boyfriend - ${result.model}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: system-ui;
              }
              img {
                max-width: 90vw;
                max-height: 80vh;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
              }
              .info {
                color: #fff;
                margin-top: 20px;
                text-align: center;
                background: rgba(255,255,255,0.1);
                padding: 16px 24px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
              }
              .cost {
                color: #10b981;
                font-size: 24px;
                font-weight: bold;
                margin: 8px 0;
              }
              .model {
                color: #60a5fa;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <img src="${result.url}" alt="Generated Boyfriend" />
            <div class="info">
              <div class="model">${result.usedFallback ? '⚠️ Using Fallback' : '✅ fal.ai'}: ${result.model}</div>
              <div class="cost">$${result.cost.toFixed(4)}</div>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 8px;">
                ${result.usedFallback ? `Saved: $0.00 (no fal.ai credits)` : `Saved: $0.031 (79.5% cheaper!)`}
              </div>
            </div>
          </body>
        </html>
      `);
    }
    
    const usedService = result.usedFallback ? 'Gemini (fallback)' : 'fal.ai';
    const savingsMsg = result.usedFallback 
      ? 'Using Gemini fallback (no fal.ai credits)'
      : `Saved $${comparison.savings.toFixed(4)} vs Gemini!`;
    
    alert(
      `✅ SUCCESS! Image Generated\n\n` +
      `Service: ${usedService}\n` +
      `Model: ${result.model}\n` +
      `Cost: $${result.cost.toFixed(4)}\n\n` +
      `${savingsMsg}\n\n` +
      `Image opened in new tab!\n` +
      `Check aspect ratio - should be 9:16 vertical.`
    );
  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    alert(`Error: ${error.message}\n\nCheck console (F12) for details.`);
  }
}}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3 transition-colors"
              >
                <span className="text-2xl">🎭</span>
                <div>
                  <div className="font-bold">Generate Dynamic Personas</div>
                  <div className="text-purple-200 text-sm">Create unique council members - $0.0006</div>
                </div>
              </button>
              <button 
                onClick={async () => {
                  try {
                    const { generateWhisperExperience, trackWhisperEngagement } = await import('../services/whisperBackService');
                    
                    alert('Generating intimate whisper experience...\n\nThis includes:\n- Personalized script (Gemini $0.0006)\n- Voice generation (ElevenLabs ~$0.01)\n\nTotal: ~$0.0106\n\nWill take 10-15 seconds.');
                    
                    const startTime = Date.now();
                    
                    const experience = await generateWhisperExperience(
                      'Axel Stone',
                      'The Rockstar',
                      'Intense gaze, leather jacket, tattoos, rebellious energy'
                    );
                    
                    console.log('🎧 Whisper Experience:', experience);
                    
                    // Play audio
                    const audio = new Audio(experience.audioUrl);
                    
                    let listenDuration = 0;
                    let hasPlayed = false;
                    
                    audio.onplay = () => {
                      hasPlayed = true;
                      console.log('▶️ Audio started playing');
                    };
                    
                    audio.onended = () => {
                      listenDuration = Date.now() - startTime;
                      trackWhisperEngagement({
                        characterName: experience.characterName,
                        trope: experience.trope,
                        listened: true,
                        listenDuration,
                        replayed: false,
                        timestamp: Date.now()
                      });
                      console.log('✅ Audio finished');
                    };
                    
                    audio.play();
                    
                    alert(
                      `✅ WHISPER EXPERIENCE READY!\n\n` +
                      `Character: ${experience.characterName}\n` +
                      `Trope: ${experience.trope}\n` +
                      `Mood: ${experience.script.mood}\n` +
                      `Duration: ${experience.script.duration}\n\n` +
                      `Cost: $${experience.cost.toFixed(4)}\n\n` +
                      `🎧 Audio is now playing!\n\n` +
                      `Script:\n"${experience.script.text.substring(0, 100)}..."\n\n` +
                      `Full script in console (F12)`
                    );
                    
                    // Track that they generated it
                    if (!hasPlayed) {
                      trackWhisperEngagement({
                        characterName: experience.characterName,
                        trope: experience.trope,
                        listened: false,
                        timestamp: Date.now()
                      });
                    }
                  } catch (error: any) {
                    console.error('WhisperBack error:', error);
                    alert('Error: ' + error.message + '\n\nCheck console (F12) for details.');
                  }
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3 transition-colors"
              >
                <span className="text-2xl">🎧</span>
                <div>
                  <div className="font-bold">Generate Whisper Experience</div>
                  <div className="text-pink-200 text-sm">Intimate ASMR voice + script - $0.01</div>
                </div>
              </button>
              <button 
                onClick={async () => {
                  try {
                    const { generateSocialPost, generateContentBatch, calculateBatchCost, getAvailableTropes } = await import('../services/socialContentService');
                    
                    const choice = window.confirm(
                      'Social Content Factory\n\n' +
                      'Generate 1 test post (15 seconds) or 10 posts batch (3 minutes)?\n\n' +
                      'Click OK for 1 post\n' +
                      'Click Cancel for 10 posts'
                    );
                    
                    if (choice) {
                      // Generate 1 test post
                      alert('Generating 1 test post...\n\nThis will take about 15 seconds.');
                      
                      const post = await generateSocialPost('The Billionaire');
                      
                      console.log('Generated Post:', post);
                      
                      // Open image in new tab
                      window.open(post.image.url, '_blank');
                      
                      alert(
                        `SUCCESS! Post generated!\n\n` +
                        `Trope: ${post.trope}\n` +
                        `Hook: ${post.hookLine}\n\n` +
                        `Cost: $${post.totalCost.toFixed(4)}\n` +
                        `(Text: $0.0006 + Image: $${post.image.cost})\n\n` +
                        `Image opened in new tab.\n` +
                        `Check console for caption, hashtags, and POV script!`
                      );
                    } else {
                      // Generate 10 posts
                      const tropes = getAvailableTropes();
                      const cost = calculateBatchCost(10);
                      
                      const confirm = window.confirm(
                        `Generate 10 BookTok posts?\n\n` +
                        `Cost: $${cost.total.toFixed(2)}\n` +
                        `Time: ~3 minutes\n\n` +
                        `This will create 10 complete posts with:\n` +
                        `- Images\n` +
                        `- Captions\n` +
                        `- Hashtags\n` +
                        `- POV scripts\n\n` +
                        `Continue?`
                      );
                      
                      if (confirm) {
                        alert('Generating 10 posts... Check console for progress.\n\nThis will take about 3 minutes.');
                        
                        const posts = await generateContentBatch(tropes, 10);
                        
                        console.log('Generated Posts:', posts);
                        
                        const totalCost = posts.reduce((sum, p) => sum + p.totalCost, 0);
                        
                        alert(
                          `SUCCESS! Generated ${posts.length} posts!\n\n` +
                          `Total Cost: $${totalCost.toFixed(2)}\n` +
                          `Average: $${(totalCost / posts.length).toFixed(4)} per post\n\n` +
                          `All posts logged to console.\n` +
                          `Open console (F12) to see details!`
                        );
                      }
                    }
                  } catch (error: any) {
                    alert('Error: ' + error.message);
                    console.error('Social content error:', error);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3 transition-colors"
              >
                <span className="text-2xl">📱</span>
                <div>
                  <div className="font-bold">Social Content Factory</div>
                  <div className="text-blue-200 text-sm">Generate BookTok posts - 1 test or 10 batch</div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  if (window.confirm('This will exit superuser mode. Continue?')) {
                    clearSuperuser().then(() => onClose());
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg text-left flex items-center gap-3"
              >
                <span className="text-2xl">🔓</span>
                <div>
                  <div className="font-bold">Exit Superuser Mode</div>
                  <div className="text-red-200 text-sm">Go back to public view</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperuserPanel;