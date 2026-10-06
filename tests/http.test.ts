import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { HttpError, json, readJson, safely, str, toNodeHandler } from '../api/_lib/http';
import { post, silenceConsole } from './helpers';

describe('readJson', () => {
  it('parses objects and rejects everything else', async () => {
    expect(await readJson(post('/x', { a: 1 }))).toEqual({ a: 1 });
    await expect(readJson(post('/x', '{bad'))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(post('/x', '[1]'))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(post('/x', 'null'))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(post('/x', '"str"'))).rejects.toMatchObject({ status: 400 });
  });

  it('enforces the byte limit', async () => {
    await expect(readJson(post('/x', { a: 'x'.repeat(200) }), 100)).rejects.toMatchObject({ status: 413 });
    // multi-byte characters count as bytes, not characters
    await expect(readJson(post('/x', { a: 'é'.repeat(60) }), 100)).rejects.toMatchObject({ status: 413 });
  });
});

describe('str', () => {
  it('requires, types and caps strings', () => {
    expect(str('ok', 'f', 5)).toBe('ok');
    expect(() => str(undefined, 'f', 5)).toThrow(HttpError);
    expect(() => str('', 'f', 5)).toThrow(HttpError);
    expect(() => str(42, 'f', 5)).toThrow(HttpError);
    expect(() => str('too long', 'f', 5)).toThrow(HttpError);
    expect(str(undefined, 'f', 5, true)).toBe('');
    expect(() => str(42, 'f', 5, true)).toThrow(HttpError);
  });
});

describe('safely', () => {
  it('maps HttpError to its status and hides unexpected errors', async () => {
    silenceConsole();
    const known = await safely(async () => {
      throw new HttpError(418, 'teapot');
    })(post('/x', {}));
    expect(known.status).toBe(418);
    expect(await known.json()).toEqual({ error: 'teapot' });

    const unknown = await safely(async () => {
      throw new Error('db password is hunter2');
    })(post('/x', {}));
    expect(unknown.status).toBe(500);
    expect(await unknown.text()).not.toContain('hunter2');
  });

  it('marks JSON responses as uncacheable', () => {
    expect(json({ a: 1 }).headers.get('cache-control')).toBe('no-store');
  });
});

describe('toNodeHandler (Node req/res adapter used by Vercel and the dev server)', () => {
  let server: Server | undefined;
  afterEach(() => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())));

  const serve = async (listener: (req: IncomingMessage, res: ServerResponse) => unknown) => {
    server = createServer((req, res) => void listener(req, res));
    await new Promise<void>((r) => server!.listen(0, '127.0.0.1', r));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  const echo = toNodeHandler(async (request) => {
    const body = request.method === 'GET' ? null : await request.json();
    return json(
      { method: request.method, path: new URL(request.url).pathname, body },
      { headers: { 'x-extra': '1' } },
    );
  });

  it('reads a streamed body and returns status, headers and JSON', async () => {
    const base = await serve(echo);
    const res = await fetch(`${base}/api/echo?x=1`, { method: 'POST', body: JSON.stringify({ hi: 'there' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-extra')).toBe('1');
    expect(await res.json()).toEqual({ method: 'POST', path: '/api/echo', body: { hi: 'there' } });
  });

  it('uses a body the platform already parsed (Vercel sets req.body)', async () => {
    const base = await serve((req, res) => {
      (req as IncomingMessage & { body?: unknown }).body = { parsed: true };
      return echo(req, res);
    });
    const res = await fetch(`${base}/api/echo`, { method: 'POST', body: '{"ignored":true}' });
    expect((await res.json()).body).toEqual({ parsed: true });
  });

  it('passes through GET requests and multiple Set-Cookie headers', async () => {
    const base = await serve(
      toNodeHandler(async () => {
        const headers = new Headers();
        headers.append('Set-Cookie', 'a=1; HttpOnly');
        headers.append('Set-Cookie', 'b=2; HttpOnly');
        return new Response('ok', { headers });
      }),
    );
    const res = await fetch(`${base}/api/x`);
    expect(await res.text()).toBe('ok');
    expect(res.headers.getSetCookie()).toEqual(['a=1; HttpOnly', 'b=2; HttpOnly']);
  });

  it('forwards the cookie header to the handler', async () => {
    const base = await serve(toNodeHandler(async (request) => json({ cookie: request.headers.get('cookie') })));
    const res = await fetch(`${base}/`, { headers: { cookie: 'vit_su=abc' } });
    expect(await res.json()).toEqual({ cookie: 'vit_su=abc' });
  });
});
