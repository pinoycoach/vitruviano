import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from '../api/superuser';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  isSuperuserRequest,
  secretsMatch,
  verifySessionToken,
} from '../api/_lib/superuser';
import { BASE, post, superuserHeaders } from './helpers';

const SECRET = 'correct-horse-battery-staple';

const get = (headers: Record<string, string> = {}) => new Request(`${BASE}/api/superuser`, { headers });
const cookieFrom = (res: Response) => res.headers.get('set-cookie') ?? '';
const tokenFrom = (res: Response) => /vit_su=([^;]*)/.exec(cookieFrom(res))?.[1] ?? '';

describe('session tokens', () => {
  it('round-trips and rejects wrong secrets', () => {
    const token = createSessionToken(SECRET);
    expect(verifySessionToken(token, SECRET)).toBe(true);
    expect(verifySessionToken(token, 'another-secret')).toBe(false);
  });

  it('expires after the TTL', () => {
    const issuedAt = Date.now();
    const token = createSessionToken(SECRET, issuedAt);
    expect(verifySessionToken(token, SECRET, issuedAt + (SESSION_TTL_SECONDS - 5) * 1000)).toBe(true);
    expect(verifySessionToken(token, SECRET, issuedAt + (SESSION_TTL_SECONDS + 5) * 1000)).toBe(false);
  });

  it('rejects tampered expiry, tampered signature and malformed tokens', () => {
    const [exp, sig] = createSessionToken(SECRET).split('.');
    expect(verifySessionToken(`${Number(exp) + 10_000}.${sig}`, SECRET)).toBe(false);
    expect(verifySessionToken(`${exp}.${sig.slice(0, -1)}0`, SECRET)).toBe(false);
    for (const bad of ['', 'garbage', '.', 'abc.def', `${exp}.`, `${exp}.${sig}.extra`, '9999999999.deadbeef']) {
      expect(verifySessionToken(bad, SECRET)).toBe(false);
    }
  });
});

describe('secretsMatch', () => {
  it('compares exactly, regardless of length', () => {
    expect(secretsMatch(SECRET, SECRET)).toBe(true);
    expect(secretsMatch('wrong', SECRET)).toBe(false);
    expect(secretsMatch(`${SECRET}x`, SECRET)).toBe(false);
    expect(secretsMatch('', SECRET)).toBe(false);
  });
});

describe('/api/superuser', () => {
  beforeEach(() => {
    vi.stubEnv('SUPERUSER_SECRET', SECRET);
  });

  it('reports not-superuser for anonymous callers', async () => {
    const res = await handle(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ superuser: false });
  });

  it('fails closed when SUPERUSER_SECRET is not configured', async () => {
    vi.stubEnv('SUPERUSER_SECRET', '');
    const res = await handle(post('/api/superuser', { secret: '' }));
    expect(res.status).toBe(503);
    // Even a cookie signed with an empty/known secret must not grant access.
    const forged = `${SESSION_COOKIE}=${createSessionToken('')}`;
    expect(isSuperuserRequest(get({ cookie: forged }))).toBe(false);
  });

  it('rejects a wrong secret without setting a cookie', async () => {
    const res = await handle(post('/api/superuser', { secret: 'nope' }));
    expect(res.status).toBe(401);
    expect(cookieFrom(res)).toBe('');
    expect(await res.json()).toEqual({ error: 'Invalid secret' });
  });

  it('accepts the right secret and issues an HttpOnly, SameSite=Strict signed cookie', async () => {
    const res = await handle(post('/api/superuser', { secret: SECRET }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ superuser: true });

    const cookie = cookieFrom(res);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api');
    expect(cookie).toContain(`Max-Age=${SESSION_TTL_SECONDS}`);
    expect(cookie).toContain('Secure'); // request URL is https
    // The cookie carries a signed token, never the secret itself.
    expect(cookie).not.toContain(SECRET);
    expect(verifySessionToken(tokenFrom(res), SECRET)).toBe(true);
  });

  it('omits Secure on plain-http localhost so dev still works', async () => {
    const req = new Request('http://localhost:3000/api/superuser', {
      method: 'POST',
      body: JSON.stringify({ secret: SECRET }),
    });
    expect(cookieFrom(await handle(req))).not.toContain('Secure');
  });

  it('recognises the issued cookie on later requests, and rejects forged ones', async () => {
    const login = await handle(post('/api/superuser', { secret: SECRET }));
    const cookie = `${SESSION_COOKIE}=${tokenFrom(login)}`;

    expect(await (await handle(get({ cookie }))).json()).toEqual({ superuser: true });
    expect(await (await handle(get({ cookie: `${SESSION_COOKIE}=9999999999.deadbeef` }))).json()).toEqual({
      superuser: false,
    });
    // The legacy localStorage-style flags have no effect server-side.
    expect(await (await handle(get({ cookie: 'vitruviano_superuser=true' }))).json()).toEqual({ superuser: false });
  });

  it('logs out by expiring the cookie', async () => {
    const res = await handle(new Request(`${BASE}/api/superuser`, { method: 'DELETE', headers: superuserHeaders() }));
    expect(res.status).toBe(200);
    expect(cookieFrom(res)).toContain('Max-Age=0');
  });

  it('validates the request body', async () => {
    expect((await handle(post('/api/superuser', '{not json'))).status).toBe(400);
    expect((await handle(post('/api/superuser', {}))).status).toBe(400);
    expect((await handle(post('/api/superuser', { secret: 123 }))).status).toBe(400);
    expect((await handle(post('/api/superuser', { secret: 'x'.repeat(300) }))).status).toBe(400);
    expect((await handle(post('/api/superuser', { secret: 'x'.repeat(2000) }))).status).toBe(413);
    expect((await handle(post('/api/superuser', '[]'))).status).toBe(400);
  });

  it('rejects unsupported methods', async () => {
    const res = await handle(new Request(`${BASE}/api/superuser`, { method: 'PUT' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, POST, DELETE');
  });

  it('never echoes the secret in any response body', async () => {
    const bodies = await Promise.all([
      handle(post('/api/superuser', { secret: SECRET })).then((r) => r.text()),
      handle(post('/api/superuser', { secret: 'bad' })).then((r) => r.text()),
      handle(get()).then((r) => r.text()),
    ]);
    for (const b of bodies) expect(b).not.toContain(SECRET);
  });
});
