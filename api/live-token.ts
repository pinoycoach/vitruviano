import { Modality } from '@google/genai';
import { MODELS } from '../config/models.js';
import { getAi, upstream } from './_lib/gemini.js';
import { HttpError, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { liveSystemInstruction } from './_lib/prompts.js';
import { parseVoice } from './_lib/voices.js';

/**
 * Mint a short-lived, single-use Gemini Live token so the browser can open the
 * realtime websocket without ever seeing GEMINI_API_KEY. Model, voice and
 * system prompt are locked into the token.
 *
 * POST { name, trope, voiceName } -> { token, model }
 */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const body = await readJson(request, 2 * 1024);
  const name = str(body.name, 'name', 200);
  const trope = str(body.trope, 'trope', 100);
  const voiceName = parseVoice(body.voiceName);

  const ai = getAi();
  const now = Date.now();
  const token = await upstream('Live token', () =>
    ai.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        expireTime: new Date(now + 15 * 60 * 1000).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
        liveConnectConstraints: {
          model: MODELS.live,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            systemInstruction: liveSystemInstruction(name, trope),
          },
        },
      },
    }),
  );
  if (!token.name) throw new HttpError(502, 'Live token creation failed');
  return json({ token: token.name, model: MODELS.live });
});

export default toNodeHandler(handle);
