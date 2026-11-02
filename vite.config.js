import { defineConfig, loadEnv } from 'vite';
import { askGemini } from './server/gemini.js';

// A tiny "plugin" that adds a /api/chat endpoint to Vite's server.
// The browser calls /api/chat, and THIS code (running on the server) calls Gemini.
// That way your secret API key never gets sent to the browser.
function geminiProxy(env) {
  const handler = async (req, res) => {
    if (req.url !== '/api/chat' || req.method !== 'POST') return false;

    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };

    // Read the JSON body the browser sent
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null; // askGemini will answer "Invalid request"
    }

    const { status, body } = await askGemini(env, payload);
    send(status, body);
    return true;
  };

  // Note: the braces matter. Vite treats a *returned* value from configureServer
  // as a function to run later, so this function must return nothing.
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!(await handler(req, res))) next();
    });
  };

  return {
    name: 'gemini-proxy',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig(({ mode }) => {
  // '' as the 3rd argument = load ALL .env variables, not only VITE_ ones
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [geminiProxy(env)] };
});
