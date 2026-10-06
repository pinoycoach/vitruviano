import { vi } from 'vitest';
import { SESSION_COOKIE, createSessionToken } from '../api/_lib/superuser';

export const BASE = 'https://app.test';

export const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

/** Headers carrying a valid superuser session for the currently stubbed SUPERUSER_SECRET. */
export const superuserHeaders = (): Record<string, string> => ({
  cookie: `${SESSION_COOKIE}=${createSessionToken(process.env.SUPERUSER_SECRET as string)}`,
});

/** Expected-failure paths log via console.error/warn; keep test output readable. */
export const silenceConsole = () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
};
