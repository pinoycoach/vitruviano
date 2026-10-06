# Overnight hardening report

Branch: `overnight/2026-10-07-hardening` (9 commits on top of `main`, all pushed).
Nothing was pushed to `main`, nothing merged, no force-pushes, **no PR opened** (you did not ask for one).

Final state: `npm run check` passes (typecheck, lint, 101 tests, build). `npm audit`: **0 vulnerabilities**. Build has no warnings.

## Read this first: what you must do manually

1. **Rotate every key and secret that was ever used.** The old code put `VITE_GEMINI_API_KEY`, `VITE_ELEVENLABS_API_KEY` and `VITE_FAL_KEY` into the public JavaScript bundle, and `vite.config.ts` injected `GEMINI_API_KEY` into it as well. Any deployed build exposed them to anyone who opened DevTools. Removing them from the code does not un-leak them.
   - Gemini key, ElevenLabs key, fal.ai key: create new ones, revoke the old ones.
   - Superuser secret `cash_vitruviano_2026` is still in git history (and in any old deployed bundle). It no longer works for anything, but pick a **new** `SUPERUSER_SECRET` and never reuse that value.
2. **Set these environment variables in Vercel** (Production and Preview), names exactly as written, **no `VITE_` prefix**:

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `GEMINI_API_KEY` | yes | all Gemini text/image/TTS and Live tokens |
   | `ELEVENLABS_API_KEY` | yes (for WhisperBack voice) | ElevenLabs |
   | `FAL_KEY` | optional | fal.ai images; without it the superuser image tools fall back to Gemini |
   | `SUPERUSER_SECRET` | yes (if you want the panel) | login secret and session-signing key. Long and random: `openssl rand -hex 32`. If unset, superuser access is **disabled entirely**. |
   | `GEMINI_MODEL_*`, `ELEVENLABS_MODEL`, `FAL_MODEL` | optional | override a model name without a code change (see item 3) |

   Delete the old `VITE_GEMINI_API_KEY`, `VITE_ELEVENLABS_API_KEY`, `VITE_FAL_KEY` variables from Vercel.
3. **Deploy this branch as a Vercel *preview* and smoke-test it before merging.** I could not run it on Vercel from this sandbox (see "Not verified" below). Checklist at the bottom.
4. **Add rate limiting in Vercel** (Firewall / WAF rule on `/api/*`, and ideally Bot Protection). The public routes (`/api/profile`, `/api/image`, `/api/tts`, `/api/hook`, `/api/chat`, `/api/live-token`, `/api/whisper/*`, `/api/personas`) are open to anyone, as the app is. They validate and size-cap input, never let the client pick a model or a voice, and never reveal a key, but they **can still be called repeatedly and spend your quota**. Per-instance in-memory limiting is not meaningful on serverless, so I did not fake it. Set a Google Cloud / ElevenLabs spending cap as well.
5. Open a PR from the branch when you are happy (I did not create one).

## What changed, per item

### 1. SECURITY: superuser (done, `aedd254`)
- Removed the hardcoded secret, the `localStorage` flag, the `?superuser=true&key=...` URL flow, and **all** `window.vitruviano` globals (in both `config/superuser.ts` and `config/features.ts`).
- New `POST /api/superuser` compares the submitted secret against `SUPERUSER_SECRET` **server-side** (constant-time), then sets an **HttpOnly, SameSite=Strict, HMAC-signed, 8-hour** session cookie (`Secure` on https). `GET` reports status, `DELETE` logs out. Fails closed if the env var is missing. Failed attempts are delayed 400 ms.
- The browser can no longer decide it is a superuser: the client keeps only an in-memory copy of the server's answer, for UI. The superuser-only routes (`/api/fal-image`, `/api/social`) **re-verify the cookie on every call**, so the old "flip a flag in the console" attack gives nothing, even for the paid image tools.
- New login prompt: **Ctrl+Shift+S** opens the panel if you are logged in, otherwise a password prompt. (The old URL-key login is gone by design: secrets in URLs end up in logs and history.)

### 2. SECURITY: API keys (done, `86266f9`)
- Every Gemini, ElevenLabs and fal.ai call now runs in a Vercel function under `/api`. Routes: `profile`, `image`, `tts`, `hook`, `chat`, `personas`, `live-token`, `whisper/script`, `whisper/voice`, `fal-image` (superuser), `social` (superuser), `superuser`.
- **Prompts moved server-side too.** The client sends only structured fields (trope, name, ...) with length caps; it cannot send an arbitrary prompt, choose a model, or choose an ElevenLabs voice id. Gemini voices are an allow-list.
- **Live voice call** cannot be proxied (websocket), so `/api/live-token` mints a **single-use, short-lived (1 min to start, 15 min total) ephemeral token** with model, voice and persona locked in; the browser connects with only that token. `@google/genai` is now lazy-loaded just for this (main bundle 246 kB to 195 kB).
- Chat is stateless: the browser keeps history and sends it each turn (max 40 turns).
- Env naming unified: server-only `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `FAL_KEY`, `SUPERUSER_SECRET`. `vite.config.ts` no longer has a `define` block (it was injecting the key into the client). `.env.example` added; `.gitignore` now ignores `.env*` except the example. `vite-env.d.ts` cleaned.
- `npm run dev` serves `/api` locally through a small dev middleware (loads `.env.local`); production uses Vercel's own routing. `vercel.json` sets `maxDuration: 60`.
- A regression test (`tests/noClientSecrets.test.ts`) fails the build if any client file references a key name, `VITE_*KEY`, `import.meta.env`, a direct provider URL, or the old bypass.

### 3. MODELS (done, `4dbc7cf`): **please read the confidence note**
All names now live in `config/models.ts`, each overridable by an env var, so a wrong guess is fixable from the Vercel dashboard without redeploying code.

| Was | Now | Why | Confidence |
| --- | --- | --- | --- |
| `gemini-2.5-flash-8b` | `gemini-3.5-flash-lite` | not in any current model list | medium |
| `gemini-3-flash-preview` | `gemini-3.5-flash` | GA text model | high |
| `gemini-3-pro-image-preview` | `gemini-3-pro-image` | preview was shut down 2026-06-25, GA replacement | high |
| `gemini-2.5-flash-image` | `gemini-3.1-flash-image` | old one shut down 2026-10-02 (i.e. already gone) | medium |
| `gemini-2.5-flash-preview-tts` | `gemini-3.8-flash-tts` | Google's stated replacement | medium-high |
| `gemini-2.5-flash-native-audio-preview-09-2025` | `gemini-3.1-flash-live-preview` | Google's recommended Live replacement | **low-medium** |
| `eleven_monolingual_v1` | `eleven_multilingual_v2` | legacy ElevenLabs model | high |

- **How I verified:** the Google docs sites (ai.google.dev etc.) are blocked in this sandbox, so I could **not** read the official pages. I cross-checked web-search results (several quoting the official deprecations page) and the installed SDK's type definitions. Treat the table as best-effort and **confirm against https://ai.google.dev/gemini-api/docs/models and /deprecations**. Newer models (a 3.8 Live model, 3.8 Flash) appear to exist; I chose the options with the strongest evidence, not the newest.
- Also fixed while there: social-media copy was calling an **image** model for text; `social` now uses the text model. fal request used parameters the Flux Ultra endpoint ignores (`image_size`, `num_inference_steps`); now sends `aspect_ratio: '9:16'`. The hardcoded cost figures in the UI (`$0.008`, `$0.039`, ...) are rough estimates I did not touch.
- The **Live call is the highest-risk change**: new model generation, ephemeral tokens, and `sendRealtimeInput({ audio })` (the old `media` field is the legacy one). It type-checks and the token endpoint is tested, but nobody has heard a real call. Test it first.

### 4. DEPENDENCIES (done, `0877045`)
- Audit at the start: 13 vulnerabilities (11 high); the 4 production highs were `ws`, `lodash`, `minimatch`, `brace-expansion`. Now **0**, via plain `npm audit fix` (no `--force`).
- Updated: vite 6 to 8, `@vitejs/plugin-react` 5.2, TypeScript 5.9, `@google/genai` 1.34 to 1.52, react/react-dom 18.2 to 18.3.1, recharts 2.12.7 to 2.15.4, `@types/react(-dom)` added.
- **Deliberately not upgraded:** React 19 (recharts 2.x does not support it; not trivial), `@google/genai` 2.x (new major, would touch the Live and token code I could not test), TypeScript 7 (new native compiler), `@types/node` 24+ (kept on 22 to match the runtime).

### 5. BUILD (done, `788bf51`, `ddc4a0c`)
- Tailwind CDN replaced with a real build. I chose **Tailwind v4**, not v3: v3 pulls in `braces`, which has no patched release at all, so the audit could not reach 0 with it. The black/gold theme (colors `davinci-*`, fonts, `slow-fade` / `pulse-subtle` animations and keyframes, scrollbar and `cinematic-shadow` styles) was migrated 1:1 into `index.css`.
- v4 changes some defaults, so I added compatibility base styles (default border color, button cursor) and renamed the five utilities v4 redefined (`rounded`, `rounded-sm`, `shadow-sm`, `backdrop-blur*`, `outline-none`, `flex-grow`). One `mt-12` was removed because v4's `space-y` would have doubled it.
- **Verified visually, not just by grep:** I built the *original* `main` with real Tailwind v3 and the same config, and pixel-diffed menu, manifest and director views against the new build: **identical**. The casting view differed only in one line of error text (different error source). A DOM scan of the menu, profile dashboard (with mocked API) and superuser panel found no other `space-*` margin conflicts.
- Unused `esm.sh` importmap, the CDN script, and the dangling `/index.css` link removed. The `whisperBackService` static/dynamic import warning is fixed (it is now a static import in `SuperuserPanel`, since it was already in the main bundle). Vite 8's `__dirname` warning fixed.

### 6. QUALITY (done, `ddc4a0c`, `aca4c3b`)
- ESLint 10 (flat config, typescript-eslint, react-hooks): **0 errors, 49 warnings**. The warnings are existing `any` usage and two React-Compiler-style rules (`set-state-in-effect`, `immutability`) that I downgraded to warnings rather than rewrite working UI effects overnight. One real fix: dead assignment in `calculationService`.
- Vitest 5, **101 tests**, all external APIs mocked (SDK and `fetch`; setup blanks real keys from the environment, so no test can reach a live service): `calculationService` (14), superuser session/cookie (14), Gemini routes (28), ElevenLabs/fal/social routes (17), the Node req/res adapter and helpers (9), the client superuser module (6), and the client no-secrets guard (13). They cover failure paths, auth gating, fallbacks and "no secret in any response".
- **Mutation-checked:** I deliberately broke 9 things (always-true secret check, no expiry, no `HttpOnly`, skipped superuser gate on both routes, token `uses: 5`, wrong text model, client-chosen voice id, a `VITE_` key in a client file); each made the suite fail. Tests live in `tests/`, not `api/`, so Vercel does not deploy them as functions.
- `npm run check` runs typecheck + lint + test + build.

### 7. Preference-signals plan (done, `5645265`)
`docs/PREFERENCE_SIGNALS_PLAN.md`: draft only, nothing wired up. Notable finding: despite the README's claim, the only signal recorded today is whisper engagement in `localStorage`; casting reactions, director choices, etc. are not recorded anywhere. The plan puts privacy and consent first (these are sensitive preferences) and ends with five questions for you.

## What I skipped, and why
- **Rate limiting / abuse protection in code**: not meaningful per-instance on serverless; needs Vercel WAF or a store like Upstash. Called out above.
- **Moving the wallet/coins server-side**: out of scope; it is client state and cheats trivially (noted in the plan).
- **Rewriting the React effects flagged by lint**, **removing the 49 `any` warnings**: behavior-risking, deferred.
- **React 19, genai 2.x, TS 7**: see item 4.
- **Fixing pre-existing UI quirks** (I only report them): the main menu sits in a narrow left column (the original does exactly the same, confirmed by the pixel comparison); the SUPERUSER button overlaps "Disconnect" and the economy overlay at top-right; `animate-fade-in` is used but was never defined.

## Not verified (could not be done in this sandbox)
- **Never ran on Vercel.** Concerns to check in the preview: that functions using ESM `.js` relative imports bundle correctly (Vercel docs were blocked), that `vercel.json`'s `functions` glob is accepted, and the 4.5 MB request/response cap for large base64 images (the "intimates" route sends a reference image up and an image back).
- **No real API key was available**, so no real Gemini / ElevenLabs / fal call, and no real Live audio call was made. Route logic is covered by mocks; the real-world behavior of the new model names is not.
- Official Google docs were unreachable (see item 3).

## How to test the branch locally
```bash
git fetch origin overnight/2026-10-07-hardening
git checkout overnight/2026-10-07-hardening
npm ci
npm run check              # typecheck + lint + 101 tests + build, no keys needed

cp .env.example .env.local # fill in GEMINI_API_KEY (+ others), SUPERUSER_SECRET
npm run dev                # http://localhost:3000, /api served by the dev middleware
```
Quick manual checks:
1. DevTools, Sources/Network: search the loaded JS for your key prefix. It must not appear anywhere.
2. `curl localhost:3000/api/superuser` returns `{"superuser":false}`; Ctrl+Shift+S, enter the secret, the purple SUPERUSER button appears; reload and it persists (cookie); in the console `localStorage.setItem('vitruviano_superuser','true')` does nothing.
3. `curl -X POST localhost:3000/api/fal-image -H 'content-type: application/json' -d '{"prompt":"x"}'` returns 403 when not logged in.
4. Generate a profile (Manifest Him), confirm image and voice; open the dashboard and try Whisper, then **the live call** (riskiest).

### Vercel preview smoke test
Set the env vars on the preview, deploy the branch, then repeat checks 1 to 4 against the preview URL. If a model 404s in the function logs, set the matching `GEMINI_MODEL_*` variable (names in `.env.example`) and redeploy; no code change needed.

## Commits
```
d3897a1 README: document new architecture, env vars and scripts
5645265 Draft plan for server-side preference signal persistence (docs only, not wired up)
aca4c3b Add Vitest with 101 tests: calculationService, /api routes, superuser, client guard
ddc4a0c Add ESLint (flat config, typescript-eslint, react-hooks); fix vite config __dirname
788bf51 Replace Tailwind CDN with a real Tailwind v4 build; drop importmap
0877045 Update dependencies and clear npm audit (0 vulnerabilities)
4dbc7cf Replace retired/invalid models and centralize names in config/models.ts
86266f9 Move all Gemini/ElevenLabs/fal calls into Vercel serverless functions
aedd254 Move superuser check server-side; remove hardcoded secret and window globals
```
