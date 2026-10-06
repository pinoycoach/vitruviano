import { MODELS } from '../config/models.js';
import { generateImage } from './_lib/gemini.js';
import { HttpError, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { fantasyImagePrompt, intimatesImagePrompt } from './_lib/prompts.js';

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * POST { kind: 'fantasy', profile } | { kind: 'intimates', profile, referenceImage? (data URL) }
 * -> { image: <data URL> }
 */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  // Reference images are base64; Vercel itself caps request bodies at 4.5MB.
  const body = await readJson(request, 4 * 1024 * 1024);
  const profile = (body.profile ?? {}) as Record<string, unknown>;

  if (body.kind === 'fantasy') {
    const prompt = fantasyImagePrompt({
      name: str(profile.name, 'profile.name', 200),
      trope: str(profile.trope, 'profile.trope', 100),
      visualDescription: str(profile.visualDescription, 'profile.visualDescription', 2000),
      atmosphere: str(profile.atmosphere, 'profile.atmosphere', 300),
    });
    return json({ image: await generateImage(prompt, [MODELS.imagePrimary, MODELS.imageFallback]) });
  }

  if (body.kind === 'intimates') {
    const prompt = intimatesImagePrompt(
      str(profile.name, 'profile.name', 200),
      str(profile.intimatesDescription, 'profile.intimatesDescription', 2000, true) || undefined,
    );
    let reference;
    if (body.referenceImage !== undefined && body.referenceImage !== null && body.referenceImage !== '') {
      const match = typeof body.referenceImage === 'string' ? DATA_URL.exec(body.referenceImage) : null;
      if (!match) throw new HttpError(400, 'Invalid referenceImage');
      reference = { mimeType: match[1], data: match[2] };
    }
    return json({ image: await generateImage(prompt, [MODELS.imageFallback, MODELS.imagePrimary], reference) });
  }

  throw new HttpError(400, 'Invalid kind');
});

export default toNodeHandler(handle);
