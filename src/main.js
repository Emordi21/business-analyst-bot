import './style.css';
import { MODES } from './modes.js';
import { state, persist, createProject } from './store.js';
import { docTypeOf } from './docTypes.js';
import { esc, uid, debounce } from './utils.js';
import { renderChat } from './views/chat.js';
import { renderQuiz } from './views/quiz.js';
import { renderProject } from './views/project.js';
import { renderDoc } from './views/doc.js';
import { renderSearch } from './views/search.js';

const $ = (id) => document.getElementById(id);

// The top "bubbles": every BA task plus the Quiz.
const BUBBLES = [
  ...MODES.map((m) => ({ view: { type: 'chat', id: m.id }, key: `chat:${m.id}`, icon: m.icon, label: m.label, hue: m.hue })),
  { view: { type: 'quiz' }, key: 'quiz', icon: '🎓', label: 'Quiz', hue: 75 },
];

const HUES = { project: 150, doc: 150, search: 135 };
let view = { type: 'chat', id: 'requirements' };

const viewKey = (v) => (v.type === 'chat' ? `chat:${v.id}` : v.type);

// ---- Router: show a screen ----
function go(next) {
  view = next;
  const bubble = BUBBLES.find((b) => b.key === viewKey(next));
  // Changing --hue on <body> recolours the whole UI (see style.css)
  document.body.style.setProperty('--hue', bubble?.hue ?? HUES[next.type] ?? 135);
  renderBubbles();
  renderTree();
  const el = $('view');
  el.dataset.token = uid(); // lets old async jobs know the screen has changed
  el.innerHTML = '';
  const screens = { chat: renderChat, quiz: renderQuiz, project: renderProject, doc: renderDoc, search: renderSearch };
  screens[next.type](el, next, app);
  closeDrawer();
}

const app = { go, refreshSidebar: renderTree };

// ---- Top bubbles ----
function renderBubbles() {
  const nav = $('bubbles');
  nav.innerHTML = '';
  BUBBLES.forEach((b) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bubble' + (b.key === viewKey(view) ? ' active' : '');
    btn.style.setProperty('--hue', b.hue); // each bubble keeps its own colour
    btn.innerHTML = `<span class="orb">${b.icon}</span><span class="lbl">${esc(b.label)}</span>`;
    btn.addEventListener('click', () => go(b.view));
    nav.appendChild(btn);
  });
  nav.querySelector('.active')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

// ---- Sidebar: projects folder tree ----
function renderTree() {
  const tree = $('tree');
  if (!state.projects.length) {
    tree.innerHTML = '<p class="empty">No projects yet.<br/>Create one to generate PRDs, business cases and more.</p>';
    return;
  }
  tree.innerHTML = state.projects
    .map((p) => {
      const open = state.expanded[p.id];
      const isActiveProject = view.type === 'project' && view.id === p.id;
      return `
      <div class="folder">
        <div class="folder-row ${isActiveProject ? 'active' : ''} ${state.activeProjectId === p.id ? 'current' : ''}">
          <button class="chev" data-toggle="${p.id}" aria-label="Expand">${open ? '▾' : '▸'}</button>
          <button class="folder-name" data-project="${p.id}" title="${esc(p.name)}">${open ? '📂' : '📁'} ${esc(p.name)}</button>
        </div>
        ${open ? `<ul class="files">${p.docs.length ? p.docs.map((d) => `
          <li><button class="file ${view.type === 'doc' && view.docId === d.id ? 'active' : ''}" data-project="${p.id}" data-doc="${d.id}" title="${esc(d.title)}">${docTypeOf(d.type).icon} ${esc(d.title)}</button></li>`).join('') : '<li class="empty small">Empty folder</li>'}</ul>` : ''}
      </div>`;
    })
    .join('');
}

$('tree').addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    state.expanded[toggle.dataset.toggle] = !state.expanded[toggle.dataset.toggle];
    persist();
    return renderTree();
  }
  const item = e.target.closest('[data-project]');
  if (!item) return;
  if (item.dataset.doc) return go({ type: 'doc', projectId: item.dataset.project, docId: item.dataset.doc });
  state.expanded[item.dataset.project] = true;
  persist();
  go({ type: 'project', id: item.dataset.project });
});

// ---- Search ----
const search = $('search');
search.addEventListener(
  'input',
  debounce(() => {
    const q = search.value.trim();
    if (q) go({ type: 'search', q });
    else if (view.type === 'search') go({ type: 'chat', id: 'requirements' });
  }, 250),
);
search.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    search.value = '';
    search.dispatchEvent(new Event('input'));
  }
});

// ---- New project dialog ----
const dialog = $('project-dialog');
$('new-project').addEventListener('click', () => {
  $('project-form').reset();
  dialog.showModal();
});
$('cancel-project').addEventListener('click', () => dialog.close());
$('project-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const project = createProject({ name: f.get('name'), context: f.get('context') });
  dialog.close();
  go({ type: 'project', id: project.id });
});

// ---- Mobile drawer ----
const closeDrawer = () => document.body.classList.remove('drawer-open');
$('menu').addEventListener('click', () => document.body.classList.toggle('drawer-open'));
$('scrim').addEventListener('click', closeDrawer);

// Start on the first task
go({ type: 'chat', id: 'requirements' });
