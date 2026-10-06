import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MODELS } from '../config/models';
import { audioResponse, genai, genaiModuleFactory, imageResponse, textResponse } from './genaiMock';
import { post, silenceConsole } from './helpers';

vi.mock('@google/genai', () => genaiModuleFactory());

import { handle as chat } from '../api/chat';
import { handle as hook } from '../api/hook';
import { handle as image } from '../api/image';
import { handle as liveToken } from '../api/live-token';
import { handle as personas } from '../api/personas';
import { handle as profile } from '../api/profile';
import { handle as tts } from '../api/tts';
import { handle as whisperScript } from '../api/whisper/script';

const KEY = 'test-gemini-key-123';

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', KEY);
});
afterEach(() => vi.useRealTimers());

const callArgs = () => genai.generateContent.mock.calls[0][0];

describe('every route: configuration and method handling', () => {
  const routes = { profile, image, tts, hook, chat, personas, liveToken, whisperScript };

  it('returns 405 for non-POST requests', async () => {
    for (const [name, route] of Object.entries(routes)) {
      const res = await route(new Request('https://app.test/api/x'));
      expect(res.status, name).toBe(405);
    }
  });

  it('returns 503 (not a crash or a key leak) when GEMINI_API_KEY is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const cases: [string, Request][] = [
      ['profile', post('/api/profile', { kind: 'manifest', bookDescription: 'x' })],
      ['image', post('/api/image', { kind: 'fantasy', profile: { name: 'n', trope: 't', visualDescription: 'v', atmosphere: 'a' } })],
      ['tts', post('/api/tts', { text: 'hi' })],
      ['hook', post('/api/hook', { trope: 'The Royal' })],
      ['chat', post('/api/chat', { persona: { name: 'n', archetype: 'a' }, message: 'hi' })],
      ['personas', post('/api/personas', {})],
      ['liveToken', post('/api/live-token', { name: 'n', trope: 't' })],
      ['whisperScript', post('/api/whisper/script', { characterName: 'n', trope: 't', visualDescription: 'v' })],
    ];
    for (const [name, req] of cases) {
      const res = await routes[name as keyof typeof routes](req);
      expect(res.status, name).toBe(503);
    }
    expect(genai.generateContent).not.toHaveBeenCalled();
  });
});

describe('/api/profile', () => {
  const profileJson = { name: 'Adrian', trope: 'The Billionaire', hookLine: 'Mine.' };

  it('manifest: builds the prompt server-side and returns parsed JSON', async () => {
    genai.generateContent.mockResolvedValue(textResponse(JSON.stringify(profileJson)));
    const res = await profile(post('/api/profile', { kind: 'manifest', bookDescription: 'A brooding duke' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: profileJson });
    const args = callArgs();
    expect(args.model).toBe(MODELS.text);
    expect(args.contents).toContain('A brooding duke');
    expect(args.config.responseMimeType).toBe('application/json');
    expect(args.config.systemInstruction).toContain('Soul of NEXUS');
    expect(genai.ctorArgs).toEqual([{ apiKey: KEY }]);
  });

  it('strips markdown code fences from model output', async () => {
    genai.generateContent.mockResolvedValue(textResponse('```json\n{"name":"Fenced"}\n```'));
    const res = await profile(post('/api/profile', { kind: 'core', input: { name: 'N', trope: 'T', archetype: 'A', vibe: 'V' } }));
    expect(await res.json()).toEqual({ data: { name: 'Fenced' } });
    expect(callArgs().contents).toContain('Create a core profile for N, a T');
  });

  it('enrich: only forwards name and trope into the prompt', async () => {
    genai.generateContent.mockResolvedValue(textResponse('{"intimatesDescription":"x"}'));
    const res = await profile(post('/api/profile', { kind: 'enrich', profile: { name: 'Adrian', trope: 'The Royal', secret: 'ignored' } }));
    expect(res.status).toBe(200);
    expect(callArgs().contents).toContain('Adrian (The Royal)');
    expect(callArgs().contents).not.toContain('ignored');
  });

  it('ignores any model a client tries to choose', async () => {
    genai.generateContent.mockResolvedValue(textResponse('{"a":1}'));
    await profile(post('/api/profile', { kind: 'manifest', bookDescription: 'x', model: 'gemini-ultra-expensive' }));
    expect(callArgs().model).toBe(MODELS.text);
  });

  it('validates input', async () => {
    const bad: unknown[] = [
      { kind: 'nope' },
      {},
      { kind: 'manifest' },
      { kind: 'manifest', bookDescription: 'x'.repeat(4001) },
      { kind: 'manifest', bookDescription: 42 },
      { kind: 'core', input: { name: 'n' } },
      { kind: 'enrich', profile: {} },
    ];
    for (const body of bad) {
      expect((await profile(post('/api/profile', body))).status, JSON.stringify(body)).toBe(400);
    }
    expect((await profile(post('/api/profile', 'x'.repeat(20_000)))).status).toBe(413);
    expect(genai.generateContent).not.toHaveBeenCalled();
  });

  it('returns a generic 502 and does not leak upstream details', async () => {
    silenceConsole();
    genai.generateContent.mockRejectedValue(Object.assign(new Error(`quota exceeded for key ${KEY}`), { status: 429 }));
    const res = await profile(post('/api/profile', { kind: 'manifest', bookDescription: 'x' }));
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).not.toContain(KEY);
    expect(text).not.toContain('quota');
  });

  it('returns 502 when the model replies with no JSON', async () => {
    genai.generateContent.mockResolvedValue(textResponse('I cannot do that.'));
    expect((await profile(post('/api/profile', { kind: 'manifest', bookDescription: 'x' }))).status).toBe(502);
    genai.generateContent.mockResolvedValue(textResponse('{broken json'));
    expect((await profile(post('/api/profile', { kind: 'manifest', bookDescription: 'x' }))).status).toBe(502);
  });

  it('retries once-flaky 503s from Gemini', async () => {
    vi.useFakeTimers();
    genai.generateContent
      .mockRejectedValueOnce(Object.assign(new Error('overloaded'), { status: 503 }))
      .mockResolvedValueOnce(textResponse('{"ok":true}'));
    const pending = profile(post('/api/profile', { kind: 'manifest', bookDescription: 'x' }));
    await vi.advanceTimersByTimeAsync(1000);
    const res = await pending;
    expect(res.status).toBe(200);
    expect(genai.generateContent).toHaveBeenCalledTimes(2);
  });

  it('does not retry client errors', async () => {
    silenceConsole();
    genai.generateContent.mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
    await profile(post('/api/profile', { kind: 'manifest', bookDescription: 'x' }));
    expect(genai.generateContent).toHaveBeenCalledTimes(1);
  });
});

describe('/api/image', () => {
  const fantasy = { kind: 'fantasy', profile: { name: 'Adrian', trope: 'The Royal', visualDescription: 'dark hair', atmosphere: 'Palace Balcony' } };

  it('fantasy: returns a data URL from the primary model', async () => {
    genai.generateContent.mockResolvedValue(imageResponse('QUJD', 'image/jpeg'));
    const res = await image(post('/api/image', fantasy));
    expect(await res.json()).toEqual({ image: 'data:image/jpeg;base64,QUJD' });
    expect(callArgs().model).toBe(MODELS.imagePrimary);
    expect(callArgs().contents.parts[0].text).toContain('Adrian, The Royal');
  });

  it('falls back to the second image model when the first fails or returns nothing', async () => {
    genai.generateContent.mockRejectedValueOnce(new Error('model gone')).mockResolvedValueOnce(imageResponse('WFla'));
    const res = await image(post('/api/image', fantasy));
    expect(res.status).toBe(200);
    expect(genai.generateContent.mock.calls.map((c) => c[0].model)).toEqual([MODELS.imagePrimary, MODELS.imageFallback]);

    genai.generateContent.mockReset();
    genai.generateContent.mockResolvedValueOnce({ candidates: [] }).mockResolvedValueOnce(imageResponse('WFla'));
    expect((await image(post('/api/image', fantasy))).status).toBe(200);
  });

  it('returns 502 when every model fails', async () => {
    silenceConsole();
    genai.generateContent.mockRejectedValue(new Error('down'));
    expect((await image(post('/api/image', fantasy))).status).toBe(502);
  });

  it('intimates: passes a validated reference image to the model', async () => {
    genai.generateContent.mockResolvedValue(imageResponse());
    const res = await image(
      post('/api/image', {
        kind: 'intimates',
        profile: { name: 'Adrian', intimatesDescription: 'black boxer briefs' },
        referenceImage: 'data:image/png;base64,QUJDREVG',
      }),
    );
    expect(res.status).toBe(200);
    const parts = callArgs().contents.parts;
    expect(parts[0]).toEqual({ inlineData: { mimeType: 'image/png', data: 'QUJDREVG' } });
    expect(parts[1].text).toContain('black boxer briefs');
    expect(callArgs().model).toBe(MODELS.imageFallback);
  });

  it('intimates: works without a reference and uses a default description', async () => {
    genai.generateContent.mockResolvedValue(imageResponse());
    await image(post('/api/image', { kind: 'intimates', profile: { name: 'Adrian' } }));
    expect(callArgs().contents.parts).toHaveLength(1);
    expect(callArgs().contents.parts[0].text).toContain('black designer boxer briefs');
  });

  it('rejects malformed reference images and unknown kinds', async () => {
    const bad = [
      'not a data url',
      'data:text/html;base64,PHNjcmlwdD4=',
      'data:image/png;base64,@@@@',
      'https://evil.test/x.png',
      42,
    ];
    for (const referenceImage of bad) {
      const res = await image(post('/api/image', { kind: 'intimates', profile: { name: 'A' }, referenceImage }));
      expect(res.status, String(referenceImage)).toBe(400);
    }
    expect((await image(post('/api/image', { kind: 'other', profile: {} }))).status).toBe(400);
    expect((await image(post('/api/image', { kind: 'fantasy', profile: { name: 'only name' } }))).status).toBe(400);
    expect(genai.generateContent).not.toHaveBeenCalled();
  });
});

describe('/api/tts and /api/hook', () => {
  it('tts: returns audio and uses the configured TTS model', async () => {
    genai.generateContent.mockResolvedValue(audioResponse('UENN'));
    const res = await tts(post('/api/tts', { text: 'Hello', voiceName: 'Kore' }));
    expect(await res.json()).toEqual({ audio: 'UENN' });
    expect(callArgs().model).toBe(MODELS.tts);
    expect(callArgs().config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Kore');
  });

  it('tts: only allows known voices (falls back to Fenrir)', async () => {
    genai.generateContent.mockResolvedValue(audioResponse());
    await tts(post('/api/tts', { text: 'Hello', voiceName: 'EvilVoice' }));
    expect(callArgs().config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Fenrir');
  });

  it('tts: validates text and handles empty audio', async () => {
    silenceConsole();
    expect((await tts(post('/api/tts', {}))).status).toBe(400);
    expect((await tts(post('/api/tts', { text: 'x'.repeat(2001) }))).status).toBe(400);
    genai.generateContent.mockResolvedValue({ candidates: [] });
    expect((await tts(post('/api/tts', { text: 'hi' }))).status).toBe(502);
  });

  it('hook: generates a line, then speaks it with the requested voice', async () => {
    genai.generateContent
      .mockResolvedValueOnce(textResponse('  I have been waiting for you.  '))
      .mockResolvedValueOnce(audioResponse('QVVESU8='));
    const res = await hook(post('/api/hook', { trope: 'The Royal Dilemma', voiceName: 'Charon' }));
    expect(await res.json()).toEqual({ text: 'I have been waiting for you.', audio: 'QVVESU8=' });
    expect(genai.generateContent.mock.calls[0][0].model).toBe(MODELS.text);
    expect(genai.generateContent.mock.calls[0][0].contents).toContain('The Royal Dilemma');
    expect(genai.generateContent.mock.calls[1][0].contents[0].parts[0].text).toBe('I have been waiting for you.');
  });

  it('hook: falls back to a default line when the model returns nothing', async () => {
    genai.generateContent.mockResolvedValueOnce(textResponse('   ')).mockResolvedValueOnce(audioResponse());
    expect((await (await hook(post('/api/hook', { trope: 'X' }))).json()).text).toBe("I've been waiting.");
  });
});

describe('/api/chat', () => {
  const persona = { name: 'Adrian', bio: 'A duke', archetype: 'Brooding Duke' };

  it('maps history into Gemini turns and appends the new message', async () => {
    genai.generateContent.mockResolvedValue(textResponse('Come closer.'));
    const res = await chat(
      post('/api/chat', {
        persona,
        history: [
          { role: 'user', text: 'Hello' },
          { role: 'model', text: 'Hi.' },
        ],
        message: 'Miss me?',
      }),
    );
    expect(await res.json()).toEqual({ text: 'Come closer.' });
    expect(callArgs().contents).toEqual([
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Hi.' }] },
      { role: 'user', parts: [{ text: 'Miss me?' }] },
    ]);
    expect(callArgs().config.systemInstruction).toContain('You are Adrian, a Brooding Duke');
    expect(callArgs().model).toBe(MODELS.text);
  });

  it('rejects bad roles, oversized history and missing fields', async () => {
    const base = { persona, message: 'hi' };
    expect((await chat(post('/api/chat', { ...base, history: [{ role: 'system', text: 'x' }] }))).status).toBe(400);
    expect((await chat(post('/api/chat', { ...base, history: 'nope' }))).status).toBe(400);
    const long = Array.from({ length: 41 }, () => ({ role: 'user', text: 'x' }));
    expect((await chat(post('/api/chat', { ...base, history: long }))).status).toBe(400);
    expect((await chat(post('/api/chat', { persona, history: [] }))).status).toBe(400);
    expect((await chat(post('/api/chat', { message: 'hi', history: [] }))).status).toBe(400);
    expect(genai.generateContent).not.toHaveBeenCalled();
  });
});

describe('/api/live-token', () => {
  it('mints a single-use token with model, voice and persona locked in; never returns the API key', async () => {
    genai.createToken.mockResolvedValue({ name: 'auth_tokens/ephemeral-abc' });
    const res = await liveToken(post('/api/live-token', { name: 'Adrian', trope: 'The Royal', voiceName: 'Charon' }));
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ token: 'auth_tokens/ephemeral-abc', model: MODELS.live });
    expect(text).not.toContain(KEY);

    const { config } = genai.createToken.mock.calls[0][0];
    expect(config.uses).toBe(1);
    expect(config.httpOptions).toEqual({ apiVersion: 'v1alpha' });
    expect(config.liveConnectConstraints.model).toBe(MODELS.live);
    expect(config.liveConnectConstraints.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Charon');
    expect(config.liveConnectConstraints.config.systemInstruction).toContain('You are Adrian');

    // short-lived: new sessions within ~1 minute, whole token within 15 minutes
    const now = Date.now();
    expect(Date.parse(config.newSessionExpireTime) - now).toBeLessThanOrEqual(61_000);
    expect(Date.parse(config.expireTime) - now).toBeLessThanOrEqual(15 * 60_000 + 1000);
  });

  it('502s if Google returns no token, and validates input', async () => {
    silenceConsole();
    genai.createToken.mockResolvedValue({});
    expect((await liveToken(post('/api/live-token', { name: 'A', trope: 'T' }))).status).toBe(502);
    expect((await liveToken(post('/api/live-token', { name: 'A' }))).status).toBe(400);
  });
});

describe('/api/personas and /api/whisper/script', () => {
  it('personas: extracts the JSON array and uses the lite model', async () => {
    genai.generateContent.mockResolvedValue(textResponse('Sure!\n[{"role":"The Visionary","name":"A"}]\nDone'));
    const res = await personas(post('/api/personas', {}));
    expect(await res.json()).toEqual({ personas: [{ role: 'The Visionary', name: 'A' }] });
    expect(callArgs().model).toBe(MODELS.textLite);
  });

  it('whisper script: includes the trope vibe and returns the parsed script', async () => {
    const script = { text: 'Come here...', duration: '60 seconds', mood: 'seductive', setting: 'Late night' };
    genai.generateContent.mockResolvedValue(textResponse(JSON.stringify(script)));
    const res = await whisperScript(
      post('/api/whisper/script', { characterName: 'Adrian', trope: 'The Billionaire', visualDescription: 'tall' }),
    );
    expect(await res.json()).toEqual({ script });
    expect(callArgs().contents).toContain('I own everything I touch');
    expect((await whisperScript(post('/api/whisper/script', { trope: 'T', visualDescription: 'v' }))).status).toBe(400);
  });
});
