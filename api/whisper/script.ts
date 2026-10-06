import { extractJson, generateText } from '../_lib/gemini.js';
import { json, methodNotAllowed, readJson, safely, str, toNodeHandler } from '../_lib/http.js';
import { whisperPrompt } from '../_lib/prompts.js';

/** POST { characterName, trope, visualDescription } -> { script: WhisperScript } */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const body = await readJson(request, 8 * 1024);
  const prompt = whisperPrompt(
    str(body.characterName, 'characterName', 200),
    str(body.trope, 'trope', 100),
    str(body.visualDescription, 'visualDescription', 2000),
  );
  const text = await generateText(prompt);
  return json({ script: extractJson(text, 'object') });
});

export default toNodeHandler(handle);
