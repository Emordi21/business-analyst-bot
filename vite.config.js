import { defineConfig, loadEnv } from 'vite';

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

    if (!env.GEMINI_API_KEY) {
      send(500, { error: 'GEMINI_API_KEY is missing. Copy .env.example to .env and add your key, then restart.' });
      return true;
    }

    // Read the JSON body the browser sent
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      send(400, { error: 'Invalid JSON' });
      return true;
    }

    const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: payload.system }] },
          // Gemini calls the assistant role "model" (not "assistant")
          contents: payload.messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        }),
      });
      const data = await upstream.json();
      if (!upstream.ok) {
        send(upstream.status, { error: data?.error?.message || 'Gemini request failed' });
        return true;
      }
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
      send(200, { text: text || '(The model returned an empty response.)' });
    } catch (err) {
      send(502, { error: `Could not reach Gemini: ${err.message}` });
    }
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
