// All saved data lives here and is stored in the browser's localStorage.
// (No account or database needed - but it stays on THIS browser/device only.)
import { uid } from './utils.js';

const KEY = 'ba-copilot-v1';

const defaults = () => ({
  projects: [], // [{ id, name, context, createdAt, docs: [{ id, type, title, content, createdAt, updatedAt }] }]
  chats: {}, // { "<projectId|none>:<modeId>": [{ role, content, isError? }] }
  quizResults: [], // [{ topic, difficulty, score, total, at }]
  activeProjectId: null,
  expanded: {}, // which projects are open in the sidebar
});

function load() {
  try {
    return { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return defaults(); // storage blocked or corrupted -> start fresh
  }
}

export const state = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full/blocked: the app still works, it just won't remember */
  }
}

export const getProject = (id) => state.projects.find((p) => p.id === id) ?? null;
export const activeProject = () => getProject(state.activeProjectId);

export function setActiveProject(id) {
  state.activeProjectId = id;
  persist();
}

export function createProject({ name, context }) {
  const project = { id: uid(), name: name.trim(), context: context.trim(), createdAt: Date.now(), docs: [] };
  state.projects.unshift(project);
  state.activeProjectId = project.id;
  state.expanded[project.id] = true;
  persist();
  return project;
}

export function deleteProject(id) {
  state.projects = state.projects.filter((p) => p.id !== id);
  Object.keys(state.chats).forEach((k) => k.startsWith(`${id}:`) && delete state.chats[k]);
  if (state.activeProjectId === id) state.activeProjectId = null;
  persist();
}

export function addDoc(projectId, { type, title, content }) {
  const project = getProject(projectId);
  const now = Date.now();
  const doc = { id: uid(), type, title, content, createdAt: now, updatedAt: now };
  project.docs.unshift(doc);
  state.expanded[projectId] = true;
  persist();
  return doc;
}

export function deleteDoc(projectId, docId) {
  const project = getProject(projectId);
  project.docs = project.docs.filter((d) => d.id !== docId);
  persist();
}

// Text block added to the AI's instructions so it knows which project it is working on.
export function projectBrief(project, { excludeType } = {}) {
  if (!project) return '';
  let brief = `\n\nACTIVE PROJECT (use this as your source of truth)\nName: ${project.name}\nContext: ${project.context}`;
  // Include earlier documents (trimmed) so new documents stay consistent with them.
  let budget = 6000;
  const earlier = project.docs.filter((d) => d.type !== excludeType && d.type !== 'note');
  for (const d of earlier) {
    if (budget <= 0) break;
    const excerpt = d.content.slice(0, Math.min(1500, budget));
    budget -= excerpt.length;
    brief += `\n\n--- Existing document: ${d.title} ---\n${excerpt}`;
  }
  return brief;
}
