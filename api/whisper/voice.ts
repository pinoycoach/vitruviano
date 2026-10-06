import { MODELS } from '../../config/models.js';
import { HttpError, errorResponse, methodNotAllowed, readJson, safely, str, toNodeHandler } from '../_lib/http.js';
import { DEFAULT_ELEVENLABS_VOICE, ELEVENLABS_VOICES } from '../_lib/voices.js';

/** POST { text, trope } -> audio/mpeg (ElevenLabs text-to-speech) */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new HttpError(503, 'ElevenLabs is not configured on the server');

  const body = await readJson(request, 8 * 1024);
  const text = str(body.text, 'text', 2500);
  const trope = str(body.trope, 'trope', 100, true);
  const voiceId = ELEVENLABS_VOICES[trope] ?? DEFAULT_ELEVENLABS_VOICE;

  const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { Accept: 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: MODELS.elevenLabs,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true },
    }),
  });
  if (!upstream.ok) {
    console.error('ElevenLabs error:', upstream.status);
    return errorResponse(502, 'Voice generation failed');
  }
  return new Response(await upstream.arrayBuffer(), {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  });
});

export default toNodeHandler(handle);
