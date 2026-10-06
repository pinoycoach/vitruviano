import { generateSpeech, generateText } from './_lib/gemini.js';
import { json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { SYSTEM_INSTRUCTION, hookPrompt } from './_lib/prompts.js';
import { parseVoice } from './_lib/voices.js';

/** POST { trope, voiceName } -> { text, audio } (opening hook line + spoken audio) */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const body = await readJson(request, 2 * 1024);
  const trope = str(body.trope, 'trope', 100);

  const raw = await generateText(hookPrompt(trope), { systemInstruction: SYSTEM_INSTRUCTION });
  const text = raw.trim() || "I've been waiting.";
  const audio = await generateSpeech(text, parseVoice(body.voiceName));
  return json({ text, audio });
});

export default toNodeHandler(handle);
