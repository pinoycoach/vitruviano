/** Thin same-origin client for the serverless functions in /api. No keys live here. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const request = async (path: string, body?: unknown): Promise<Response> => {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  return res;
};

export const postJson = async <T>(path: string, body?: unknown): Promise<T> =>
  (await request(path, body)).json() as Promise<T>;

export const postBlob = async (path: string, body?: unknown): Promise<Blob> =>
  (await request(path, body)).blob();
