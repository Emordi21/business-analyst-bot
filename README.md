# BA Copilot

An AI chatbot for Business Analysts. Pick a task (requirements, user stories, acceptance
criteria, process modelling, stakeholders, gap analysis, BRDs, general BA questions), paste
your project context, and get a tailored answer. Each task has its own conversation and a
subtly different accent colour on a Matrix-green/blue grid theme.

Built with [Vite](https://vite.dev) + plain JavaScript. LLM: Google Gemini.

## Run it

```bash
npm install
cp .env.example .env     # then put your Gemini API key in .env
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## How it works

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `src/modes.js` | The BA tasks: name, colour hue and the hidden "system prompt" for each. **Add a new task here.** |
| `src/main.js` | Chat logic: state, rendering, calling the API |
| `src/style.css` | Matrix theme; the per-task colour comes from one `--hue` variable |
| `vite.config.js` | A small server endpoint (`/api/chat`) that calls Gemini so your API key stays out of the browser |

## Notes

- The model name is set by `GEMINI_MODEL` in `.env` (default `gemini-3.8-flash`). If Gemini
  reports the model is not found, change it to a model name listed in Google AI Studio.
- The `/api/chat` endpoint works with `npm run dev` and `npm run preview`. To deploy publicly
  you need a host that can run server code (e.g. Vercel/Netlify functions or a small Node server).
