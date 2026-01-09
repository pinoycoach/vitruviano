import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const ELEVENLABS_API_KEY = (import.meta as any).env.VITE_ELEVENLABS_API_KEY;

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

// Voice mapping based on trope
const VOICE_MAP: Record<string, string> = {
  'The Billionaire': 'pNInz6obpgDQGcFmaJgB', // Adam - Deep, authoritative
  'The Rockstar': 'N2lVS1w4EtoT3dr4eOWO', // Callum - Energetic, edgy
  'The Golden Retriever': 'IKne3meq5aSn9XLyUdCD', // Charlie - Warm, friendly
  'Grumpy x Sunshine': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Intense
  'Academic Rival': 'JBFqnCBsd6RMkjVDRZzb', // George - Intelligent
  'The Bodyguard': 'ErXwobaYiN019PkySvjV', // Antoni - Strong, protective
  'The Royal': 'SOYHLrjzK2X1ezoPC6cr', // Harry - Regal
  'The Single Dad': 'IKne3meq5aSn9XLyUdCD', // Charlie - Gentle
  'The Vengeful Ex': 'N2lVS1w4EtoT3dr4eOWO', // Callum - Dark
  'Contract Husband': 'pNInz6obpgDQGcFmaJgB', // Adam - Professional
  'default': 'pNInz6obpgDQGcFmaJgB' // Adam
};

const getVoiceForTrope = (trope: string): string => {
  return VOICE_MAP[trope] || VOICE_MAP['default'];
};
const getTropeVibe = (trope: string): string => {
  const vibes: Record<string, string> = {
    'The Billionaire': 'Commanding, possessive, "I own everything I touch" energy',
    'The Rockstar': 'Intense, raw, "the world fades when I look at you" energy',
    'The Golden Retriever': 'Protective, devoted, "I\'d do anything for you" energy',
    'Grumpy x Sunshine': 'Reluctant softness, "you make me want things I shouldn\'t" energy',
    'Academic Rival': 'Competitive tension, "you challenge me and I love it" energy',
    'The Bodyguard': 'Protective obsession, "I watch over you always" energy',
    'The Royal': 'Forbidden longing, "protocol be damned" energy',
    'The Single Dad': 'Gentle strength, "I haven\'t felt this way in years" energy',
    'The Vengeful Ex': 'Dark intensity, "you think you can forget me?" energy',
    'Contract Husband': 'Reluctant desire, "this was supposed to be business" energy',
  };
  return vibes[trope] || 'Intense, intimate, obsessive energy';
};
/**
 * Generate intimate whisper script based on boyfriend profile
 */
export const generateWhisperScript = async (
  characterName: string,
  trope: string,
  visualDescription: string
): Promise<WhisperScript> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
const prompt = `You are ${characterName}, a ${trope} archetype. Create an intimate ASMR whisper script as if you're speaking directly to someone you're obsessed with.

Character Context:
- Name: ${characterName}
- Archetype: ${trope}
- Vibe: ${visualDescription}

Scene: Late night. You're alone together. Close proximity. Dim lighting. Intimate moment.

REQUIREMENTS:
- 80-120 words (60-90 seconds when spoken slowly)
- First person, speaking TO the listener ("you")
- Start with immediate intimacy (no pleasantries)
- Include specific sensory details (touch, proximity, breath)
- Use pauses: "..." for dramatic effect
- Include ONE soft sound: (soft chuckle), (sharp inhale), (low laugh)
- Build tension throughout
- End with an open question or command that leaves them wanting more
- Match the ${trope} energy: ${getTropeVibe(trope)}

TONE: Seductive, possessive, protective, or intense (matching archetype)
AVOID: Generic romance, clichés, anything that breaks character

Return ONLY JSON:
{
  "text": "Your complete whisper script with pauses...",
  "duration": "60-90 seconds",
  "mood": "seductive/possessive/protective",
  "setting": "Late night, intimate proximity"
}

Example quality: "I told myself I wouldn't come back here... (pause) but I can't stop thinking about the way you looked at me tonight. You don't even know what you do to me, do you? Come here... let me show you."`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] }
    });

    const textContent = response.text || '';
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to generate whisper script');
    }
    
    const script = JSON.parse(jsonMatch[0]);
    console.log('✅ Whisper script generated! Cost: $0.0006');
    
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
 * Convert script to voice using ElevenLabs
 */
export const generateWhisperVoice = async (
  script: string,
  voiceId: string
): Promise<{ audioUrl: string; cost: number }> => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not found');
  }

  try {
    console.log('🎙️ Generating voice with ElevenLabs...');
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // ElevenLabs cost: approximately $0.01 per generation
    console.log('✅ Voice generated! Cost: ~$0.01');
    
    return {
      audioUrl,
      cost: 0.01
    };
  } catch (error) {
    console.error('Voice generation failed:', error);
    throw error;
  }
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
  
  // Get appropriate voice
  const voiceId = getVoiceForTrope(trope);
  
  // Generate voice
  const { audioUrl, cost: voiceCost } = await generateWhisperVoice(script.text, voiceId);
  
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