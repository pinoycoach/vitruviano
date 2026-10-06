import { MODELS } from '../config/models.js';
import { extractJson, generateText } from './_lib/gemini.js';
import { json, methodNotAllowed, safely, toNodeHandler } from './_lib/http.js';
import { personasPrompt } from './_lib/prompts.js';

/** POST -> { personas: CouncilPersona[] } */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const text = await generateText(personasPrompt, { model: MODELS.textLite });
  return json({ personas: extractJson(text, 'array') });
});

export default toNodeHandler(handle);
