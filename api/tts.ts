import { generateSpeech } from './_lib/gemini.js';
import { json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { parseVoice } from './_lib/voices.js';

/** POST { text, voiceName } -> { audio: base64 PCM 24kHz mono } */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const body = await readJson(request, 8 * 1024);
  const text = str(body.text, 'text', 2000);
  return json({ audio: await generateSpeech(text, parseVoice(body.voiceName)) });
});

export default toNodeHandler(handle);
