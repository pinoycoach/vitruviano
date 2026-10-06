import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regression guard: nothing that ships to the browser may reference server
 * secrets, VITE_-prefixed keys, the old superuser bypass or build-time key
 * injection. Everything under api/ is server-only and exempt.
 */
const ROOT = join(import.meta.dirname, '..');

const walk = (path: string): string[] => {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
};

const clientFiles = [
  ...walk(join(ROOT, 'components')),
  ...walk(join(ROOT, 'services')),
  ...walk(join(ROOT, 'config')),
  join(ROOT, 'App.tsx'),
  join(ROOT, 'index.tsx'),
  join(ROOT, 'index.html'),
  join(ROOT, 'index.css'),
  join(ROOT, 'types.ts'),
  join(ROOT, 'vite-env.d.ts'),
].filter((f) => /\.(tsx?|html|css)$/.test(f));

const read = (file: string) => readFileSync(file, 'utf8');
const rel = (file: string) => file.slice(ROOT.length + 1);

describe('no secrets or bypasses in client code', () => {
  it('finds the client sources it is meant to scan', () => {
    expect(clientFiles.length).toBeGreaterThan(15);
  });

  const forbidden: [string, RegExp][] = [
    ['server API key variable names', /GEMINI_API_KEY|ELEVENLABS_API_KEY|\bFAL_KEY\b|SUPERUSER_SECRET/],
    ['VITE_-prefixed secrets', /VITE_[A-Z_]*(KEY|SECRET|TOKEN)/],
    ['import.meta.env usage', /import\.meta\.env/],
    ['process.env.API_KEY style injection', /process\.env\.[A-Z_]*(KEY|SECRET)/],
    ['the old hardcoded superuser secret', /cash_vitruviano/],
    ['localStorage superuser flag', /vitruviano_superuser/],
    ['window.vitruviano globals', /window\.vitruviano|\(window as any\)\.vitruviano/],
    ['direct provider endpoints', /api\.elevenlabs\.io|fal\.run|generativelanguage\.googleapis\.com/],
    ['xi-api-key header', /xi-api-key/],
  ];

  for (const [label, pattern] of forbidden) {
    it(`has no ${label}`, () => {
      const hits = clientFiles.filter((f) => pattern.test(read(f))).map(rel);
      expect(hits).toEqual([]);
    });
  }

  it('does not construct a GoogleGenAI client with an app-level API key', () => {
    // The only browser-side client is the Live websocket, authenticated with a short-lived server-minted token.
    const hits = clientFiles
      .filter((f) => /new GoogleGenAI\(/.test(read(f)) && !/apiKey:\s*token/.test(read(f)))
      .map(rel);
    expect(hits).toEqual([]);
  });

  it('vite.config.ts does not inject env values into the client bundle', () => {
    const config = read(join(ROOT, 'vite.config.ts'));
    expect(config).not.toMatch(/\bdefine\s*:/);
    expect(config).not.toMatch(/envPrefix/);
  });

  it('.env.example lists the server-only variables without VITE_ prefixes', () => {
    const example = read(join(ROOT, '.env.example'));
    for (const name of ['GEMINI_API_KEY', 'ELEVENLABS_API_KEY', 'FAL_KEY', 'SUPERUSER_SECRET']) {
      expect(example).toMatch(new RegExp(`^${name}=`, 'm'));
    }
    expect(example).not.toMatch(/^VITE_/m);
  });
});
