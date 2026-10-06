/**
 * Single source of truth for every third-party model name used by the app.
 * Imported only by the serverless functions in /api (never shipped to the browser).
 *
 * Google retires models often. Each name can be overridden at deploy time with
 * the env var shown beside it (no code change or rebuild needed), so a retired
 * model can be swapped from the Vercel dashboard. Last reviewed: 2026-10-06.
 */
const fromEnv = (name: string, fallback: string): string => process.env[name]?.trim() || fallback;

export const MODELS = {
  /** Text generation: profiles, chat, scripts, social copy. (GA) */
  text: fromEnv('GEMINI_MODEL_TEXT', 'gemini-3.5-flash'),
  /** Lightweight/cheap text model (council personas). */
  textLite: fromEnv('GEMINI_MODEL_TEXT_LITE', 'gemini-3.5-flash-lite'),
  /** Preferred image model (GA successor to gemini-3-pro-image-preview, retired 2026-06-25). */
  imagePrimary: fromEnv('GEMINI_MODEL_IMAGE', 'gemini-3-pro-image'),
  /** Faster image model; fallback if the primary fails and the default for reference-image edits.
   *  Replaces gemini-2.5-flash-image, which Google shut down on 2026-10-02. */
  imageFallback: fromEnv('GEMINI_MODEL_IMAGE_FALLBACK', 'gemini-3.1-flash-image'),
  /** Gemini text-to-speech (replaces gemini-2.5-flash-preview-tts). */
  tts: fromEnv('GEMINI_MODEL_TTS', 'gemini-3.8-flash-tts'),
  /** Gemini Live realtime voice (replaces gemini-2.5-flash-native-audio-preview-09-2025). */
  live: fromEnv('GEMINI_MODEL_LIVE', 'gemini-3.1-flash-live-preview'),
  /** ElevenLabs text-to-speech model (eleven_monolingual_v1 is legacy). */
  elevenLabs: fromEnv('ELEVENLABS_MODEL', 'eleven_multilingual_v2'),
  /** fal.ai image endpoint. */
  fal: fromEnv('FAL_MODEL', 'fal-ai/flux-pro/v1.1-ultra'),
} as const;
