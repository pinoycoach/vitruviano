import { beforeEach, vi } from 'vitest';
import { genai } from './genaiMock';

// Make sure a developer's real .env.local can never leak into a test run.
const SERVER_ENV = [
  'GEMINI_API_KEY',
  'ELEVENLABS_API_KEY',
  'FAL_KEY',
  'SUPERUSER_SECRET',
  'GEMINI_MODEL_TEXT',
  'GEMINI_MODEL_TEXT_LITE',
  'GEMINI_MODEL_IMAGE',
  'GEMINI_MODEL_IMAGE_FALLBACK',
  'GEMINI_MODEL_TTS',
  'GEMINI_MODEL_LIVE',
  'ELEVENLABS_MODEL',
  'FAL_MODEL',
];

beforeEach(() => {
  for (const name of SERVER_ENV) vi.stubEnv(name, '');
  vi.stubEnv('SUPERUSER_FAIL_DELAY_MS', '0');
  genai.generateContent.mockReset();
  genai.createToken.mockReset();
  genai.ctorArgs.length = 0;
});
