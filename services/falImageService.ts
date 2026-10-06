import { postJson } from './apiClient';

export interface FalImageResult {
  url: string;
  seed: number;
  cost: number;
  model: string;
  usedFallback?: boolean;
}

/**
 * Superuser-only. The server tries fal.ai first and falls back to Gemini image
 * generation; keys never reach the browser and the route re-checks the session.
 */
export const generateCheapImage = async (prompt: string): Promise<FalImageResult> =>
  postJson<FalImageResult>('/api/fal-image', { prompt });

export const generateBoyfriendImageCheap = async (
  trope: string,
  archetype: string,
  atmosphere: string
): Promise<FalImageResult> => {
  // Optimized prompt for Vertical Mobile Screens
  const prompt = `
    Cinematic portrait, 9:16 vertical aspect ratio.
    Full body or 3/4 shot of a handsome man.
    Romance novel cover style: ${trope} archetype.
    Visual aesthetic: ${archetype}.
    Setting: ${atmosphere}.
    Professional lighting, editorial quality, sharp focus.
    High fashion photography, vertical framing.
  `.trim();

  return await generateCheapImage(prompt);
};

export const getCostComparison = () => {
  return {
    geminiImage: 0.039,
    falTurbo: 0.008,
    savings: 0.031,
    savingsPercent: 79.5,
    speedup: '6.6s vs 8-10s'
  };
};