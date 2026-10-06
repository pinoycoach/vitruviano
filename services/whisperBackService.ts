import { postBlob, postJson } from './apiClient';

export interface WhisperScript {
  text: string;
  duration: string;
  mood: string;
  setting: string;
}

export interface WhisperExperience {
  script: WhisperScript;
  audioUrl: string;
  cost: number;
  characterName: string;
  trope: string;
}

/**
 * Generate intimate whisper script based on boyfriend profile
 */
export const generateWhisperScript = async (
  characterName: string,
  trope: string,
  visualDescription: string
): Promise<WhisperScript> => {
  try {
    const { script } = await postJson<{ script: WhisperScript }>('/api/whisper/script', {
      characterName,
      trope,
      visualDescription,
    });
    return script;
  } catch (error) {
    console.error('Whisper script generation failed:', error);

    // Fallback script
    return {
      text: `Hey... I've been thinking about you. ${characterName === 'Test' ? 'I' : characterName}... I can't stop thinking about you. Every time I close my eyes... there you are. Come here... let me tell you something.`,
      duration: '30 seconds',
      mood: 'intimate',
      setting: 'Late night, close proximity'
    };
  }
};

/**
 * Convert script to voice (ElevenLabs, proxied through /api/whisper/voice).
 * The server picks the voice for the trope.
 */
export const generateWhisperVoice = async (
  script: string,
  trope: string
): Promise<{ audioUrl: string; cost: number }> => {
  const audioBlob = await postBlob('/api/whisper/voice', { text: script, trope });
  // ElevenLabs cost: approximately $0.01 per generation
  return { audioUrl: URL.createObjectURL(audioBlob), cost: 0.01 };
};

/**
 * Complete WhisperBack experience
 */
export const generateWhisperExperience = async (
  characterName: string,
  trope: string,
  visualDescription: string
): Promise<WhisperExperience> => {
  console.log('🎧 Generating complete whisper experience...');
  
  // Generate script
  const script = await generateWhisperScript(characterName, trope, visualDescription);
  
  // Generate voice
  const { audioUrl, cost: voiceCost } = await generateWhisperVoice(script.text, trope);
  
  const totalCost = 0.0006 + voiceCost; // Gemini + ElevenLabs
  
  console.log(`✅ Complete experience generated! Total cost: $${totalCost.toFixed(4)}`);
  
  return {
    script,
    audioUrl,
    cost: totalCost,
    characterName,
    trope
  };
};

/**
 * Track whisper engagement (for data collection)
 */
export const trackWhisperEngagement = (data: {
  characterName: string;
  trope: string;
  listened: boolean;
  listenDuration?: number;
  replayed?: boolean;
  timestamp: number;
}): void => {
  // Store in localStorage for now (later: send to analytics)
  const key = 'vitruviano_whisper_engagement';
  const existing = localStorage.getItem(key);
  const engagements = existing ? JSON.parse(existing) : [];
  
  engagements.push(data);
  localStorage.setItem(key, JSON.stringify(engagements));
  
  console.log('📊 Whisper engagement tracked:', data);
};

/**
 * Get engagement analytics
 */
export const getWhisperAnalytics = (): {
  totalListens: number;
  averageDuration: number;
  replayRate: number;
  topTropes: string[];
} => {
  const key = 'vitruviano_whisper_engagement';
  const existing = localStorage.getItem(key);
  const engagements = existing ? JSON.parse(existing) : [];
  
  if (engagements.length === 0) {
    return {
      totalListens: 0,
      averageDuration: 0,
      replayRate: 0,
      topTropes: []
    };
  }
  
  const listened = engagements.filter((e: any) => e.listened);
  const replayed = engagements.filter((e: any) => e.replayed);
  const durations = engagements
    .filter((e: any) => e.listenDuration)
    .map((e: any) => e.listenDuration);
  
  const tropeCounts = engagements.reduce((acc: any, e: any) => {
    acc[e.trope] = (acc[e.trope] || 0) + 1;
    return acc;
  }, {});
  
  const topTropes = Object.entries(tropeCounts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)
    .map((e: any) => e[0]);
  
  return {
    totalListens: listened.length,
    averageDuration: durations.length > 0 
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length 
      : 0,
    replayRate: listened.length > 0 
      ? (replayed.length / listened.length) * 100 
      : 0,
    topTropes
  };
};