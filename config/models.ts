/**
 * Single source of truth for every third-party model name used by the app.
 * Imported by the serverless functions in /api (never shipped to the browser).
 */
export const MODELS = {
  /** Text generation: profiles, chat, scripts, personas, social copy. */
  text: 'gemini-3-flash-preview',
  /** Preferred image model. */
  imagePrimary: 'gemini-3-pro-image-preview',
  /** Image model used when the primary fails, and for reference-image edits. */
  imageFallback: 'gemini-2.5-flash-image',
  /** Gemini text-to-speech. */
  tts: 'gemini-2.5-flash-preview-tts',
  /** Gemini Live (realtime voice call) model. */
  live: 'gemini-2.5-flash-native-audio-preview-09-2025',
  /** Lightweight text model for cheap jobs (council personas). */
  textLite: 'gemini-2.5-flash-8b',
  /** ElevenLabs text-to-speech model. */
  elevenLabs: 'eleven_monolingual_v1',
  /** fal.ai image endpoint. */
  fal: 'fal-ai/flux-pro/v1.1-ultra',
} as const;
