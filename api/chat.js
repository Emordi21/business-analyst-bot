// Vercel "serverless function": any file in /api becomes an endpoint (this one is /api/chat).
// It only runs on Vercel; locally, vite.config.js provides the same endpoint.
import { askGemini } from '../server/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  // Vercel already parsed the JSON body into req.body for us
  const { status, body } = await askGemini(process.env, req.body);
  res.status(status).json(body);
}
