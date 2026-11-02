import './style.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MODES } from './modes.js';

// ---- 1. Grab the HTML elements we need to control --------------------------
const $ = (id) => document.getElementById(id);
const modesNav = $('modes');
const messagesEl = $('messages');
const form = $('form');
const input = $('input');
const sendBtn = $('send');

// ---- 2. App state ----------------------------------------------------------
// Each mode keeps its OWN conversation, so switching tasks doesn't mix contexts.
const histories = Object.fromEntries(MODES.map((m) => [m.id, []]));
let current = MODES[0];
let busy = false;

// ---- 3. Rendering ----------------------------------------------------------
function renderMarkdown(text) {
  // marked turns Markdown -> HTML; DOMPurify strips anything dangerous (XSS protection)
  return DOMPurify.sanitize(marked.parse(text));
}

function addMessage(role, content, { isError = false } = {}) {
  const div = document.createElement('div');
  div.className = `msg ${role}${isError ? ' error' : ''}`;
  if (role === 'assistant' && !isError) div.innerHTML = renderMarkdown(content);
  else div.textContent = content; // textContent is safe: it never runs HTML
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function renderChat() {
  messagesEl.innerHTML = '';
  const history = histories[current.id];
  if (history.length === 0) {
    const welcome = document.createElement('div');
    welcome.className = 'msg assistant welcome';
    welcome.innerHTML = `<h3>${current.icon} ${current.label}</h3><p>${current.desc}</p><p class="dim">${current.hint}</p>`;
    messagesEl.appendChild(welcome);
  }
  history.forEach((m) => addMessage(m.role, m.content, { isError: m.isError }));
}

function setMode(mode) {
  current = mode;
  // Changing --hue on <body> re-colours the whole UI (see style.css)
  document.body.style.setProperty('--hue', mode.hue);
  $('mode-title').textContent = `${mode.icon} ${mode.label}`;
  $('mode-desc').textContent = mode.desc;
  input.placeholder = mode.hint;
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.id === mode.id));
  renderChat();
  input.focus();
}

// ---- 4. Talking to the AI --------------------------------------------------
async function send(text) {
  const mode = current; // remember which mode asked, in case the user switches while waiting
  const history = histories[mode.id];
  history.push({ role: 'user', content: text });
  renderChat();

  busy = true;
  sendBtn.disabled = true;
  const typing = addMessage('assistant', 'Thinking…');
  typing.classList.add('typing');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only send real messages (not error bubbles) to the model
      body: JSON.stringify({
        system: mode.system,
        messages: history.filter((m) => !m.isError).map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    history.push({ role: 'assistant', content: data.text });
  } catch (err) {
    history.push({ role: 'assistant', content: `⚠️ ${err.message}`, isError: true });
  } finally {
    busy = false;
    sendBtn.disabled = false;
    if (current.id === mode.id) renderChat();
  }
}

// ---- 5. Wire up events -----------------------------------------------------
MODES.forEach((mode) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mode-btn';
  btn.dataset.id = mode.id;
  btn.style.setProperty('--hue', mode.hue); // each button previews its own colour
  btn.innerHTML = `<span class="icon">${mode.icon}</span><span>${mode.label}</span>`;
  btn.addEventListener('click', () => setMode(mode));
  modesNav.appendChild(btn);
});

form.addEventListener('submit', (e) => {
  e.preventDefault(); // stop the browser from reloading the page
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = '';
  send(text);
});

// Enter sends, Shift+Enter makes a new line
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

$('clear').addEventListener('click', () => {
  histories[current.id] = [];
  renderChat();
});

setMode(MODES[0]);
