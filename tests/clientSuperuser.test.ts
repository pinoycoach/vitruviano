import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSuperuser, isSuperuser, loginSuperuser, refreshSuperuser } from '../config/superuser';

const fetchMock = vi.fn();

beforeEach(async () => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  // reset module state: a failed refresh sets superuser = false
  fetchMock.mockRejectedValueOnce(new Error('offline'));
  await refreshSuperuser();
});

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('client superuser state (server is the only source of truth)', () => {
  it('starts false and never reads localStorage or URL parameters', async () => {
    const getItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem, setItem: vi.fn(), removeItem: vi.fn() });
    expect(isSuperuser()).toBe(false);
    fetchMock.mockResolvedValueOnce(reply({ superuser: false }));
    await refreshSuperuser();
    expect(getItem).not.toHaveBeenCalled();
  });

  it('refresh mirrors the server answer', async () => {
    fetchMock.mockResolvedValueOnce(reply({ superuser: true }));
    expect(await refreshSuperuser()).toBe(true);
    expect(isSuperuser()).toBe(true);

    fetchMock.mockResolvedValueOnce(reply({ superuser: false }));
    expect(await refreshSuperuser()).toBe(false);
  });

  it('only a truthy boolean from the server counts', async () => {
    fetchMock.mockResolvedValueOnce(reply({ superuser: 'true' }));
    expect(await refreshSuperuser()).toBe(false);
    fetchMock.mockResolvedValueOnce(reply({}, 500));
    expect(await refreshSuperuser()).toBe(false);
  });

  it('login posts the secret once, to the API only, and succeeds only on 2xx', async () => {
    fetchMock.mockResolvedValueOnce(reply({ superuser: false }, 401));
    expect(await loginSuperuser('wrong')).toBe(false);
    expect(isSuperuser()).toBe(false);

    fetchMock.mockResolvedValueOnce(reply({ superuser: true }));
    expect(await loginSuperuser('right')).toBe(true);
    expect(isSuperuser()).toBe(true);

    const [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe('/api/superuser');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('same-origin');
    expect(JSON.parse(init.body)).toEqual({ secret: 'right' });
  });

  it('a network failure during login leaves the user logged out', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await loginSuperuser('x')).toBe(false);
  });

  it('logout clears state even if the request fails', async () => {
    fetchMock.mockResolvedValueOnce(reply({ superuser: true }));
    await refreshSuperuser();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(clearSuperuser()).rejects.toThrow();
    expect(isSuperuser()).toBe(false);
  });
});
