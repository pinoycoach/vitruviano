import { errorResponse, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import {
  buildSessionCookie,
  createSessionToken,
  isSecureRequest,
  isSuperuserRequest,
  secretsMatch,
} from './_lib/superuser.js';

const failDelayMs = () => Number(process.env.SUPERUSER_FAIL_DELAY_MS ?? 400);

/**
 * GET    -> { superuser: boolean }   (is the caller's session valid?)
 * POST   -> { secret }               (verify against SUPERUSER_SECRET, set signed session cookie)
 * DELETE -> clears the session cookie
 */
export const handle = safely(async (request) => {
  const secure = isSecureRequest(request);

  if (request.method === 'GET') {
    return json({ superuser: isSuperuserRequest(request) });
  }

  if (request.method === 'DELETE') {
    return json({ superuser: false }, { headers: { 'Set-Cookie': buildSessionCookie('', secure, 0) } });
  }

  if (request.method === 'POST') {
    const expected = process.env.SUPERUSER_SECRET;
    // Fail closed: with no secret configured nobody can become superuser.
    if (!expected) return errorResponse(503, 'Superuser access is not configured');

    const body = await readJson(request, 1024);
    const provided = str(body.secret, 'secret', 256);

    if (!secretsMatch(provided, expected)) {
      await new Promise((r) => setTimeout(r, failDelayMs()));
      return errorResponse(401, 'Invalid secret');
    }
    return json(
      { superuser: true },
      { headers: { 'Set-Cookie': buildSessionCookie(createSessionToken(expected), secure) } },
    );
  }

  return methodNotAllowed(['GET', 'POST', 'DELETE']);
});

export default toNodeHandler(handle);
