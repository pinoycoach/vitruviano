import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODELS } from '../config/models';
import { genai, genaiModuleFactory, imageResponse, textResponse } from './genaiMock';
import { post, silenceConsole, superuserHeaders } from './helpers';

vi.mock('@google/genai', () => genaiModuleFactory());

import { handle as falImage } from '../api/fal-image';
import { handle as social } from '../api/social';
import { handle as whisperVoice } from '../api/whisper/voice';

const GEMINI = 'test-gemini-key-123';
const ELEVEN = 'test-eleven-key-456';
const FAL = 'test-fal-key-789';
const SECRET = 'su-secret';

const fetchMock = vi.fn();
const lastFetch = () => fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GEMINI_API_KEY', GEMINI);
  vi.stubEnv('ELEVENLABS_API_KEY', ELEVEN);
  vi.stubEnv('FAL_KEY', FAL);
  vi.stubEnv('SUPERUSER_SECRET', SECRET);
});

const falOk = (url = 'https://fal.media/img.jpg', seed = 7) =>
  new Response(JSON.stringify({ images: [{ url }], seed }), { status: 200 });

describe('/api/whisper/voice (ElevenLabs)', () => {
  const audio = new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3]);

  it('calls ElevenLabs server-side with the key header and returns audio/mpeg', async () => {
    fetchMock.mockResolvedValue(new Response(audio, { status: 200 }));
    const res = await whisperVoice(post('/api/whisper/voice', { text: 'Come here...', trope: 'The Rockstar' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('audio/mpeg');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(audio);

    const [url, init] = lastFetch();
    expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/N2lVS1w4EtoT3dr4eOWO'); // Callum for The Rockstar
    expect(init.method).toBe('POST');
    expect(init.headers['xi-api-key']).toBe(ELEVEN);
    const body = JSON.parse(init.body as string);
    expect(body.text).toBe('Come here...');
    expect(body.model_id).toBe(MODELS.elevenLabs);
  });

  it('uses the default voice for unknown tropes and no trope', async () => {
    fetchMock.mockImplementation(async () => new Response(audio));
    await whisperVoice(post('/api/whisper/voice', { text: 'hi', trope: 'Made Up Trope' }));
    await whisperVoice(post('/api/whisper/voice', { text: 'hi' }));
    for (const [url] of fetchMock.mock.calls) expect(url).toMatch(/\/pNInz6obpgDQGcFmaJgB$/);
  });

  it('does not let clients pick an arbitrary voice id (no path injection)', async () => {
    fetchMock.mockResolvedValue(new Response(audio));
    await whisperVoice(post('/api/whisper/voice', { text: 'hi', trope: '../../v1/user', voiceId: 'attacker' }));
    expect(lastFetch()[0]).toMatch(/\/pNInz6obpgDQGcFmaJgB$/);
  });

  it('503 when the key is missing; no outbound call', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    const res = await whisperVoice(post('/api/whisper/voice', { text: 'hi' }));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps upstream failures to a generic 502 without leaking details', async () => {
    silenceConsole();
    fetchMock.mockResolvedValue(new Response(`invalid api key ${ELEVEN}`, { status: 401 }));
    const res = await whisperVoice(post('/api/whisper/voice', { text: 'hi' }));
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(ELEVEN);
  });

  it('validates text', async () => {
    expect((await whisperVoice(post('/api/whisper/voice', {}))).status).toBe(400);
    expect((await whisperVoice(post('/api/whisper/voice', { text: 'x'.repeat(2501) }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/api/fal-image (superuser only)', () => {
  it('refuses anonymous callers and spends nothing', async () => {
    const res = await falImage(post('/api/fal-image', { prompt: 'a man' }));
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(genai.generateContent).not.toHaveBeenCalled();
  });

  it('refuses forged and expired sessions', async () => {
    const forged = { cookie: 'vit_su=9999999999.deadbeef' };
    expect((await falImage(post('/api/fal-image', { prompt: 'x' }, forged))).status).toBe(403);
    expect((await falImage(post('/api/fal-image', { prompt: 'x' }, { cookie: 'vitruviano_superuser=true' }))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls fal.ai with the server-side key and returns the image', async () => {
    fetchMock.mockResolvedValue(falOk());
    const res = await falImage(post('/api/fal-image', { prompt: 'a man in a suit' }, superuserHeaders()));
    const text = await res.text();

    expect(JSON.parse(text)).toMatchObject({ url: 'https://fal.media/img.jpg', seed: 7, model: MODELS.fal, usedFallback: false });
    expect(text).not.toContain(FAL);

    const [url, init] = lastFetch();
    expect(url).toBe(`https://fal.run/${MODELS.fal}`);
    expect(init.headers.Authorization).toBe(`Key ${FAL}`);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ prompt: 'a man in a suit', aspect_ratio: '9:16', num_images: 1 });
  });

  it('falls back to Gemini when fal.ai errors', async () => {
    silenceConsole();
    fetchMock.mockResolvedValue(new Response('no credits', { status: 402 }));
    genai.generateContent.mockResolvedValue(imageResponse('QUJD'));
    const res = await falImage(post('/api/fal-image', { prompt: 'x' }, superuserHeaders()));
    const data = await res.json();
    expect(data).toMatchObject({ url: 'data:image/png;base64,QUJD', usedFallback: true, model: MODELS.imageFallback });
    expect(genai.generateContent.mock.calls[0][0].model).toBe(MODELS.imagePrimary);
  });

  it('falls back to Gemini on network errors or when FAL_KEY is unset', async () => {
    silenceConsole();
    genai.generateContent.mockResolvedValue(imageResponse());
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    expect((await (await falImage(post('/api/fal-image', { prompt: 'x' }, superuserHeaders()))).json()).usedFallback).toBe(true);

    fetchMock.mockReset();
    vi.stubEnv('FAL_KEY', '');
    expect((await (await falImage(post('/api/fal-image', { prompt: 'x' }, superuserHeaders()))).json()).usedFallback).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back when fal returns no image', async () => {
    genai.generateContent.mockResolvedValue(imageResponse());
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ images: [] }), { status: 200 }));
    expect((await (await falImage(post('/api/fal-image', { prompt: 'x' }, superuserHeaders()))).json()).usedFallback).toBe(true);
  });

  it('validates the prompt', async () => {
    expect((await falImage(post('/api/fal-image', {}, superuserHeaders()))).status).toBe(400);
    expect((await falImage(post('/api/fal-image', { prompt: 'x'.repeat(3001) }, superuserHeaders()))).status).toBe(400);
  });
});

describe('/api/social (superuser only)', () => {
  const content = { caption: 'cap', hashtags: '#booktok', hookLine: 'hook', povScript: 'pov' };

  it('refuses anonymous callers', async () => {
    const res = await social(post('/api/social', { trope: 'The Billionaire' }));
    expect(res.status).toBe(403);
    expect(genai.generateContent).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('generates copy with the TEXT model (not an image model) and an image via fal', async () => {
    genai.generateContent.mockResolvedValue(textResponse(JSON.stringify(content)));
    fetchMock.mockResolvedValue(falOk('https://fal.media/p.jpg'));
    const res = await social(post('/api/social', { trope: 'The Billionaire' }, superuserHeaders()));
    const post_ = await res.json();

    expect(genai.generateContent.mock.calls[0][0].model).toBe(MODELS.text);
    expect(post_).toMatchObject({ trope: 'The Billionaire', caption: 'cap', hashtags: '#booktok', hookLine: 'hook', povScript: 'pov' });
    expect(post_.image).toEqual({ url: 'https://fal.media/p.jpg', cost: 0.008, model: MODELS.fal });
    expect(post_.totalCost).toBeCloseTo(0.0006 + 0.008, 6);
    // The trope's styling prompt reaches the image model.
    expect(JSON.parse(lastFetch()[1].body as string).prompt).toContain('Luxury penthouse');
  });

  it('uses Gemini images when fal is unavailable and prices accordingly', async () => {
    vi.stubEnv('FAL_KEY', '');
    genai.generateContent
      .mockResolvedValueOnce(textResponse(JSON.stringify(content)))
      .mockResolvedValueOnce(imageResponse('QUJD'));
    const post_ = await (await social(post('/api/social', { trope: 'Unlisted Trope' }, superuserHeaders()))).json();
    expect(post_.image.url).toBe('data:image/png;base64,QUJD');
    expect(post_.totalCost).toBeCloseTo(0.0006 + 0.039, 6);
    expect(genai.generateContent.mock.calls[1][0].contents.parts[0].text).toContain('Unlisted Trope');
  });

  it('validates trope', async () => {
    expect((await social(post('/api/social', {}, superuserHeaders()))).status).toBe(400);
    expect((await social(post('/api/social', { trope: 'x'.repeat(101) }, superuserHeaders()))).status).toBe(400);
  });
});
