import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const DATA_FILE = path.resolve(__dirname, 'data', 'hi-credit-db.json');
const GIST_ID = '10ac81dcf7df61f3c7957fb0e92f6375';

function localFileStoragePlugin() {
  return {
    name: 'local-file-storage',
    configureServer(server: any) {
      server.middlewares.use('/api/storage', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (req.method === 'GET') {
          try {
            if (fs.existsSync(DATA_FILE)) {
              const raw = fs.readFileSync(DATA_FILE, 'utf-8');
              res.statusCode = 200;
              res.end(raw);
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ ok: false, message: 'No saved file yet' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: err?.message }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const dir = path.dirname(DATA_FILE);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              JSON.parse(body);
              fs.writeFileSync(DATA_FILE, body, 'utf-8');
              // Also sync to Cloud Gist in background via gh CLI
              exec(`gh gist edit ${GIST_ID} "${DATA_FILE}"`, () => {});
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: err?.message }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false }));
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), localFileStoragePlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
