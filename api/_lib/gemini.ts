import { GoogleGenAI, Modality } from '@google/genai';
import { MODELS } from '../../config/models.js';
import { HttpError } from './http.js';

/** Server-only. The key never leaves this process. */
export const getAi = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(503, 'Gemini is not configured on the server');
  return new GoogleGenAI({ apiKey });
};

/** Run a Gemini call, mapping upstream failures to a generic 502. */
export const upstream = async <T>(label: string, fn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await fn();
  } catch (e: any) {
    if (retries > 0 && (e?.status === 500 || e?.status === 503)) {
      await new Promise((r) => setTimeout(r, 1000));
      return upstream(label, fn, retries - 1);
    }
    console.error(`${label} failed:`, e?.status ?? '', e?.message ?? e);
    throw new HttpError(502, `${label} failed`);
  }
};

export const stripJsonFences = (text: string): string =>
  text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

/** Extract the first JSON value of the given kind from free-form model text. */
export const extractJson = (text: string, kind: 'object' | 'array'): unknown => {
  const re = kind === 'object' ? /\{[\s\S]*\}/ : /\[[\s\S]*\]/;
  const match = stripJsonFences(text).match(re);
  if (!match) throw new HttpError(502, 'Model returned no JSON');
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new HttpError(502, 'Model returned invalid JSON');
  }
};

export const generateText = async (
  prompt: string,
  opts: { model?: string; systemInstruction?: string; json?: boolean } = {},
): Promise<string> => {
  const ai = getAi();
  const response = await upstream('Text generation', () =>
    ai.models.generateContent({
      model: opts.model ?? MODELS.text,
      contents: prompt,
      config: {
        ...(opts.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  );
  return response.text ?? '';
};

const firstInlineImage = (response: any): { data: string; mimeType: string } | null => {
  const part = response?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
  return part ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' } : null;
};

export interface ReferenceImage {
  data: string;
  mimeType: string;
}

/** Returns a data: URL. Tries `models` in order until one yields an image. */
export const generateImage = async (
  prompt: string,
  models: string[],
  reference?: ReferenceImage,
): Promise<string> => {
  const ai = getAi();
  const parts: any[] = reference ? [{ inlineData: reference }] : [];
  parts.push({ text: prompt });

  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ model, contents: { parts } });
      const image = firstInlineImage(response);
      if (image) return `data:${image.mimeType};base64,${image.data}`;
      lastError = new Error('No image data in response');
    } catch (e) {
      lastError = e;
    }
  }
  console.error('Image generation failed:', (lastError as any)?.message ?? lastError);
  throw new HttpError(502, 'Image generation failed');
};

/** Returns base64 PCM (24kHz, 16-bit mono). */
export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  const ai = getAi();
  const response = await upstream('Speech generation', () =>
    ai.models.generateContent({
      model: MODELS.tts,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
  );
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new HttpError(502, 'Speech generation returned no audio');
  return data;
};
