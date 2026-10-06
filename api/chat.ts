import { getAi, upstream } from './_lib/gemini.js';
import { MODELS } from '../config/models.js';
import { HttpError, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { chatSystemInstruction } from './_lib/prompts.js';

const MAX_TURNS = 40;

/**
 * Stateless chat turn.
 * POST { persona: { name, bio, archetype }, history: [{ role, text }], message } -> { text }
 */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const body = await readJson(request, 64 * 1024);

  const persona = (body.persona ?? {}) as Record<string, unknown>;
  const system = chatSystemInstruction({
    name: str(persona.name, 'persona.name', 200),
    bio: str(persona.bio, 'persona.bio', 2000, true),
    archetype: str(persona.archetype, 'persona.archetype', 200),
  });
  const message = str(body.message, 'message', 2000);

  const rawHistory = body.history ?? [];
  if (!Array.isArray(rawHistory) || rawHistory.length > MAX_TURNS) throw new HttpError(400, 'Invalid history');
  const history = rawHistory.map((turn: any) => {
    if (turn?.role !== 'user' && turn?.role !== 'model') throw new HttpError(400, 'Invalid history role');
    return { role: turn.role as 'user' | 'model', parts: [{ text: str(turn.text, 'history.text', 2000) }] };
  });

  const ai = getAi();
  const response = await upstream('Chat', () =>
    ai.models.generateContent({
      model: MODELS.text,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction: system },
    }),
  );
  return json({ text: response.text ?? '' });
});

export default toNodeHandler(handle);
