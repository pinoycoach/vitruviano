import { extractJson, generateText } from './_lib/gemini.js';
import { HttpError, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { SYSTEM_INSTRUCTION, corePrompt, enrichPrompt, manifestPrompt } from './_lib/prompts.js';

/** POST { kind: 'manifest' | 'core' | 'enrich', ... } -> { data } */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const body = await readJson(request, 16 * 1024);

  let prompt: string;
  switch (body.kind) {
    case 'manifest':
      prompt = manifestPrompt(str(body.bookDescription, 'bookDescription', 4000));
      break;
    case 'core': {
      const input = (body.input ?? {}) as Record<string, unknown>;
      prompt = corePrompt({
        name: str(input.name, 'input.name', 200),
        trope: str(input.trope, 'input.trope', 100),
        archetype: str(input.archetype, 'input.archetype', 200),
        vibe: str(input.vibe, 'input.vibe', 500),
      });
      break;
    }
    case 'enrich': {
      const profile = (body.profile ?? {}) as Record<string, unknown>;
      prompt = enrichPrompt({
        name: str(profile.name, 'profile.name', 200),
        trope: str(profile.trope, 'profile.trope', 100),
      });
      break;
    }
    default:
      throw new HttpError(400, 'Invalid kind');
  }

  const text = await generateText(prompt, { systemInstruction: SYSTEM_INSTRUCTION, json: true });
  return json({ data: extractJson(text, 'object') });
});

export default toNodeHandler(handle);
