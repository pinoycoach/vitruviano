import { MODELS } from '../config/models.js';
import { generateFalImage } from './_lib/fal.js';
import { generateImage } from './_lib/gemini.js';
import { errorResponse, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { isSuperuserRequest } from './_lib/superuser.js';

/**
 * Superuser only. POST { prompt } -> FalImageResult
 * Tries fal.ai first, then falls back to Gemini image generation.
 */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  if (!isSuperuserRequest(request)) return errorResponse(403, 'Forbidden');

  const body = await readJson(request, 8 * 1024);
  const prompt = str(body.prompt, 'prompt', 3000);

  const fal = await generateFalImage(prompt);
  if (fal) return json(fal);

  const verticalPrompt = `${prompt} --aspect 9:16 --ar 9:16. Vertical portrait composition. Full body or 3/4 shot fitting entirely in frame.`;
  const url = await generateImage(verticalPrompt, [MODELS.imagePrimary, MODELS.imageFallback]);
  return json({ url, seed: 0, cost: 0.039, model: MODELS.imageFallback, usedFallback: true });
});

export default toNodeHandler(handle);
