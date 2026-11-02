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

## Features

- **Task bubbles** across the top (Requirements, User Stories, Acceptance Criteria, Process Modelling,
  Stakeholders, Gap & Impact, BRD / Reports, Ask Anything BA). Each has its own accent colour.
- **Projects** in the side menu: create a project with context, then generate a PRD, Business Case,
  Scope Document, Project Objectives, Problem Statement, BRD, Stakeholder Register, Risk Register or
  User Story Backlog. Documents are saved in the project's folder; view, edit, copy or download them.
- **Project-aware chat:** pick a project in any chat and the AI uses its context and earlier documents.
  Save any AI reply into the project with one click.
- **Search** across all project names, context and documents.
- **Quiz:** AI-written multiple-choice questions by topic and difficulty, with explanations and a score.

## How it works

| File | Purpose |
| --- | --- |
| `index.html` | Page skeleton (sidebar, bubbles, new-project dialog) |
| `src/main.js` | App shell: navigation between screens, sidebar tree, search |
| `src/views/*.js` | One file per screen: `chat`, `quiz`, `project`, `doc`, `search` |
| `src/modes.js` | The BA tasks and their hidden "system prompts". **Add a new task here.** |
| `src/docTypes.js` | The documents the AI can generate. **Add a new document type here.** |
| `src/store.js` | Saved data (projects, documents, chats, quiz scores) in the browser's localStorage |
| `src/api.js` | Browser -> `/api/chat` |
| `server/gemini.js` | Calls Gemini (shared by the dev server and Vercel) |
| `api/chat.js` | Vercel serverless endpoint |
| `vite.config.js` | Provides `/api/chat` locally so your API key stays out of the browser |

## Notes

- The model name is set by `GEMINI_MODEL` in `.env` (default `gemini-3.8-flash`). If Gemini
  reports the model is not found, change it to a model name listed in Google AI Studio.
- Projects, documents and chats are stored in your browser (localStorage): they are private, but
  they don't sync between devices and are lost if you clear site data. Download important documents.
- Deploying to Vercel: set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the project's
  Environment Variables. `vercel.json` allows up to 60s for long documents.
