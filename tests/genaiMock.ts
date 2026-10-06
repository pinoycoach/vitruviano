import { vi } from 'vitest';

/** Shared mock state for @google/genai. No test ever talks to Google. */
export const genai = {
  generateContent: vi.fn(),
  createToken: vi.fn(),
  ctorArgs: [] as unknown[],
};

export const genaiModuleFactory = () => ({
  GoogleGenAI: class {
    models = { generateContent: genai.generateContent };
    authTokens = { create: genai.createToken };
    constructor(opts: unknown) {
      genai.ctorArgs.push(opts);
    }
  },
  Modality: { AUDIO: 'AUDIO' },
});

export const textResponse = (text: string) => ({ text });

export const imageResponse = (data = 'AAAA', mimeType = 'image/png') => ({
  candidates: [{ content: { parts: [{ inlineData: { data, mimeType } }] } }],
});

export const audioResponse = (data = 'UENNREFUQQ==') => ({
  candidates: [{ content: { parts: [{ inlineData: { data, mimeType: 'audio/L16;rate=24000' } }] } }],
});
