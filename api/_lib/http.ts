import type { IncomingMessage, ServerResponse } from 'node:http';

export type WebHandler = (request: Request) => Promise<Response>;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const errorResponse = (status: number, message: string): Response =>
  json({ error: message }, { status });

export const methodNotAllowed = (allowed: string[]): Response =>
  json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: allowed.join(', ') } });

/** Parse a JSON object body, rejecting anything over maxBytes. */
export const readJson = async (
  request: Request,
  maxBytes = 32 * 1024,
): Promise<Record<string, unknown>> => {
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError(413, 'Request body too large');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'Body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
};

/** Required string field with a length cap. */
export const str = (value: unknown, field: string, maxLen: number, optional = false): string => {
  if (value === undefined || value === null || value === '') {
    if (optional) return '';
    throw new HttpError(400, `Missing field: ${field}`);
  }
  if (typeof value !== 'string') throw new HttpError(400, `Invalid field: ${field}`);
  if (value.length > maxLen) throw new HttpError(400, `Field too long: ${field}`);
  return value;
};

/** Wrap a handler so thrown HttpErrors become JSON errors and nothing else leaks. */
export const safely =
  (handler: WebHandler): WebHandler =>
  async (request) => {
    try {
      return await handler(request);
    } catch (e) {
      if (e instanceof HttpError) return errorResponse(e.status, e.message);
      console.error('API error:', e);
      return errorResponse(500, 'Internal server error');
    }
  };

/**
 * Adapt a Web-standard handler to the Node (req, res) signature that Vercel
 * (and the vite dev middleware) call. Works whether or not the platform has
 * already consumed and parsed the body.
 */
export const toNodeHandler =
  (handler: WebHandler) =>
  async (req: IncomingMessage & { body?: unknown }, res: ServerResponse): Promise<void> => {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http';
    const host = req.headers.host ?? 'localhost';
    const url = `${proto}://${host}${req.url ?? '/'}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else if (v !== undefined) headers.set(k, v);
    }

    let body: string | undefined;
    const method = (req.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      if (req.body !== undefined && req.body !== null) {
        body =
          typeof req.body === 'string'
            ? req.body
            : Buffer.isBuffer(req.body)
              ? req.body.toString('utf8')
              : JSON.stringify(req.body);
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        body = Buffer.concat(chunks).toString('utf8');
      }
    }

    const response = await handler(new Request(url, { method, headers, body }));

    const outHeaders: Record<string, string | string[]> = {};
    response.headers.forEach((value, key) => {
      if (key !== 'set-cookie') outHeaders[key] = value;
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) outHeaders['set-cookie'] = cookies;

    res.writeHead(response.status, outHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  };
