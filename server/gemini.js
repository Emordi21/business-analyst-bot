// Shared logic: talks to Gemini and returns { status, body }.
// Used by BOTH the local Vite dev server (vite.config.js) and Vercel (api/chat.js),
// so the behaviour is identical in development and production.
export async function askGemini(env, payload) {
  if (!env.GEMINI_API_KEY) {
    return { status: 500, body: { error: 'GEMINI_API_KEY is missing. Add it to .env (local) or Vercel Environment Variables (deployed).' } };
  }
  if (!payload || typeof payload.system !== 'string' || !Array.isArray(payload.messages)) {
    return { status: 400, body: { error: 'Invalid request' } };
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
      return { status: upstream.status, body: { error: data?.error?.message || 'Gemini request failed' } };
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
    return { status: 200, body: { text: text || '(The model returned an empty response.)' } };
  } catch (err) {
    return { status: 502, body: { error: `Could not reach Gemini: ${err.message}` } };
  }
}
