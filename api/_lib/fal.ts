import { MODELS } from '../../config/models.js';

export interface FalImageResult {
  url: string;
  seed: number;
  cost: number;
  model: string;
  usedFallback?: boolean;
}

/** Server-only fal.ai call. Returns null when unconfigured or failing so callers can fall back. */
export const generateFalImage = async (prompt: string): Promise<FalImageResult | null> => {
  const key = process.env.FAL_KEY;
  if (!key) return null;
  try {
    const response = await fetch(`https://fal.run/${MODELS.fal}`, {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '9:16',
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
        sync_mode: true,
      }),
    });
    if (!response.ok) {
      console.warn('fal.ai request failed:', response.status);
      return null;
    }
    const data = (await response.json()) as { images?: { url?: string }[]; seed?: number };
    const url = data.images?.[0]?.url;
    if (!url) return null;
    return { url, seed: data.seed || 0, cost: 0.008, model: MODELS.fal, usedFallback: false };
  } catch (e) {
    console.warn('fal.ai error:', (e as Error)?.message ?? e);
    return null;
  }
};
