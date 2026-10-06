import { useEffect, useSyncExternalStore } from 'react';

/**
 * Superuser status is decided by the server. The browser only holds an
 * HttpOnly, HMAC-signed session cookie it cannot read or forge; this module
 * keeps an in-memory copy of the server's last answer for UI gating. Superuser
 * API routes re-check the cookie server-side on every call.
 */
let superuser = false;
const listeners = new Set<() => void>();

const setState = (value: boolean) => {
  if (superuser === value) return;
  superuser = value;
  listeners.forEach((l) => l());
};

export const isSuperuser = (): boolean => superuser;

export const refreshSuperuser = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/superuser', { credentials: 'same-origin' });
    const data = res.ok ? await res.json() : { superuser: false };
    setState(data.superuser === true);
  } catch {
    setState(false);
  }
  return superuser;
};

export const loginSuperuser = async (secret: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/superuser', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    setState(res.ok);
  } catch {
    setState(false);
  }
  return superuser;
};

export const clearSuperuser = async (): Promise<void> => {
  try {
    await fetch('/api/superuser', { method: 'DELETE', credentials: 'same-origin' });
  } finally {
    setState(false);
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** React hook: current superuser flag, verified against the server on mount. */
export const useSuperuser = (): boolean => {
  useEffect(() => {
    void refreshSuperuser();
  }, []);
  return useSyncExternalStore(subscribe, isSuperuser, () => false);
};
