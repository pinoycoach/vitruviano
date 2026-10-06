import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'vit_su';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/** Constant-time comparison that does not leak length. */
export const secretsMatch = (provided: string, expected: string): boolean =>
  timingSafeEqual(digest(provided), digest(expected));

const sign = (payload: string, secret: string): string =>
  createHmac('sha256', secret).update(`vitruviano-su:${payload}`).digest('hex');

export const createSessionToken = (secret: string, now = Date.now()): string => {
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${sign(String(exp), secret)}`;
};

export const verifySessionToken = (token: string, secret: string, now = Date.now()): boolean => {
  const [exp, sig, ...rest] = token.split('.');
  if (!exp || !sig || rest.length || !/^\d+$/.test(exp)) return false;
  if (Number(exp) <= Math.floor(now / 1000)) return false;
  const expected = Buffer.from(sign(exp, secret));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const readCookie = (header: string | null, name: string): string | null => {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
};

/** True only if the request carries a valid, unexpired, server-signed session. */
export const isSuperuserRequest = (request: Request): boolean => {
  const secret = process.env.SUPERUSER_SECRET;
  if (!secret) return false;
  const token = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
  return !!token && verifySessionToken(token, secret);
};

export const buildSessionCookie = (token: string, secure: boolean, maxAge = SESSION_TTL_SECONDS): string =>
  [
    `${SESSION_COOKIE}=${token}`,
    'Path=/api',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');

export const isSecureRequest = (request: Request): boolean =>
  (request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '')).startsWith('https');
