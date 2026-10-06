/** Gemini prebuilt voices the app uses. Clients may only pick from this list. */
export const GEMINI_VOICES = ['Fenrir', 'Puck', 'Kore', 'Charon'] as const;
export type GeminiVoice = (typeof GEMINI_VOICES)[number];

export const parseVoice = (value: unknown, fallback: GeminiVoice = 'Fenrir'): GeminiVoice =>
  GEMINI_VOICES.includes(value as GeminiVoice) ? (value as GeminiVoice) : fallback;

/** ElevenLabs voice ids by trope (premade voices). */
export const ELEVENLABS_VOICES: Record<string, string> = {
  'The Billionaire': 'pNInz6obpgDQGcFmaJgB', // Adam
  'The Rockstar': 'N2lVS1w4EtoT3dr4eOWO', // Callum
  'The Golden Retriever': 'IKne3meq5aSn9XLyUdCD', // Charlie
  'Grumpy x Sunshine': 'TxGEqnHWrfWFTfGW9XjX', // Josh
  'Academic Rival': 'JBFqnCBsd6RMkjVDRZzb', // George
  'The Bodyguard': 'ErXwobaYiN019PkySvjV', // Antoni
  'The Royal': 'SOYHLrjzK2X1ezoPC6cr', // Harry
  'The Single Dad': 'IKne3meq5aSn9XLyUdCD', // Charlie
  'The Vengeful Ex': 'N2lVS1w4EtoT3dr4eOWO', // Callum
  'Contract Husband': 'pNInz6obpgDQGcFmaJgB', // Adam
};
export const DEFAULT_ELEVENLABS_VOICE = 'pNInz6obpgDQGcFmaJgB';
