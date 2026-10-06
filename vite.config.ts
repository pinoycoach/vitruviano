import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-only: serve the Vercel-style functions in /api under `npm run dev`
 * (production uses Vercel's own routing). Server env vars (GEMINI_API_KEY,
 * ELEVENLABS_API_KEY, FAL_KEY, SUPERUSER_SECRET) are loaded from .env.local /
 * .env into process.env for the functions only. They are never exposed to the
 * client bundle because nothing is injected via `define` and none carries the
 * VITE_ prefix.
 */
const apiDevServer = (mode: string): Plugin => ({
  name: 'vitruviano-api-dev-server',
  apply: 'serve',
  configureServer(server) {
    const env = loadEnv(mode, process.cwd(), '');
    for (const [key, value] of Object.entries(env)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }

    server.middlewares.use(async (req, res, next) => {
      const pathname = (req.url ?? '').split('?')[0];
      // Only plain route names; `_lib` helpers and path traversal are not routable.
      if (!/^\/api\/[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(pathname)) return next();

      const file = path.join(process.cwd(), `${pathname}.ts`);
      if (!fs.existsSync(file)) return next();

      try {
        const mod = await server.ssrLoadModule(`${pathname}.ts`);
        await mod.default(req, res);
      } catch (e) {
        server.config.logger.error(`API ${pathname} crashed: ${(e as Error).message}`);
        if (!res.headersSent) res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), apiDevServer(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
