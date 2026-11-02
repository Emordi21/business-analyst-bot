import { MODES, BASE } from '../modes.js';
import { ask } from '../api.js';
import { state, persist, activeProject, setActiveProject, addDoc, projectBrief } from '../store.js';
import { esc, md, copyText, toast, tracker } from '../utils.js';

export function renderChat(el, { id: modeId }, app) {
  const mode = MODES.find((m) => m.id === modeId);
  const alive = tracker(el);
  const project = activeProject();
  // Chats are stored per project + per task, so contexts never mix.
  const key = `${project?.id ?? 'none'}:${mode.id}`;
  const history = (state.chats[key] ??= []);

  el.innerHTML = `
    <section class="panel chat">
      <header class="panel-head">
        <div class="tile">${mode.icon}</div>
        <div class="head-text"><h2>${esc(mode.label)}</h2><p>${esc(mode.desc)}</p></div>
        <label class="proj-pick" title="Give the AI a project's context">
          <span>📁</span>
          <select id="proj-select" aria-label="Active project">
            <option value="">No project</option>
            ${state.projects.map((p) => `<option value="${p.id}" ${p.id === project?.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </label>
        <button class="ghost" id="new-chat" type="button">↺ New chat</button>
      </header>
      <div class="messages-wrap">
        <div class="messages" id="messages" aria-live="polite"></div>
        <button class="to-latest" id="to-latest" type="button" hidden>↓ Latest</button>
      </div>
      <form class="composer" id="form">
        <textarea id="input" rows="1" required placeholder="${esc(mode.hint)}"></textarea>
        <button class="primary" id="send" type="submit" aria-label="Send">➤</button>
      </form>
    </section>`;

  const $ = (s) => el.querySelector(s);
  const messagesEl = $('#messages');
  const input = $('#input');
  const sendBtn = $('#send');
  const toLatest = $('#to-latest');
  let busy = false;

  // ---- drawing messages ----
  function welcome() {
    const w = document.createElement('div');
    w.className = 'welcome';
    w.innerHTML = `
      <div class="tile big">${mode.icon}</div>
      <h3>${esc(mode.label)}</h3>
      <p>${esc(mode.hint)}</p>
      ${project ? `<p class="dim">📁 Using context from <b>${esc(project.name)}</b></p>` : '<p class="dim">Tip: pick a project (top right) so answers use its context.</p>'}
      <div class="chips">${mode.examples.map((x, i) => `<button type="button" class="chip" data-i="${i}">${esc(x)}</button>`).join('')}</div>`;
    w.querySelectorAll('.chip').forEach((c) =>
      c.addEventListener('click', () => {
        input.value = mode.examples[c.dataset.i];
        autosize();
        input.focus();
      }),
    );
    return w;
  }

  function messageEl(m, idx) {
    const div = document.createElement('div');
    div.className = `msg ${m.role}${m.isError ? ' error' : ''}`;
    const body = document.createElement('div');
    body.className = 'body';
    if (m.role === 'assistant' && !m.isError) body.innerHTML = md(m.content);
    else body.textContent = m.content; // textContent never runs HTML => safe
    div.appendChild(body);

    if (m.role === 'assistant' && !m.isError) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.innerHTML = `<button type="button" data-act="copy">⧉ Copy</button>${project ? '<button type="button" data-act="save">📁 Save to project</button>' : ''}`;
      actions.addEventListener('click', async (e) => {
        const act = e.target.dataset.act;
        if (act === 'copy') toast((await copyText(m.content)) ? 'Copied to clipboard' : 'Could not copy');
        if (act === 'save') {
          const prompt = history[idx - 1]?.content ?? mode.label;
          addDoc(project.id, { type: 'note', title: `${mode.label}: ${prompt.slice(0, 50)}${prompt.length > 50 ? '…' : ''}`, content: m.content });
          app.refreshSidebar();
          toast(`Saved to ${project.name}`);
        }
      });
      div.appendChild(actions);
    }
    return div;
  }

  function draw() {
    messagesEl.innerHTML = '';
    if (!history.length) messagesEl.appendChild(welcome());
    history.forEach((m, i) => messagesEl.appendChild(messageEl(m, i)));
  }

  const scrollToBottom = () => (messagesEl.scrollTop = messagesEl.scrollHeight);
  const nearBottom = () => messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
  messagesEl.addEventListener('scroll', () => (toLatest.hidden = nearBottom()));
  toLatest.addEventListener('click', () => messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' }));

  // ---- sending ----
  async function send(text) {
    history.push({ role: 'user', content: text });
    persist();
    draw();
    scrollToBottom();

    busy = true;
    sendBtn.disabled = true;
    const typing = document.createElement('div');
    typing.className = 'msg assistant typing';
    typing.innerHTML = '<div class="body"><span class="dots"><i></i><i></i><i></i></span> Thinking…</div>';
    messagesEl.appendChild(typing);
    scrollToBottom();

    try {
      const system = mode.system + projectBrief(project);
      const reply = await ask({
        system,
        messages: history.filter((m) => !m.isError).map(({ role, content }) => ({ role, content })),
      });
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      history.push({ role: 'assistant', content: `⚠️ ${err.message}`, isError: true });
    }
    persist();
    busy = false;
    if (!alive()) return; // user moved to another screen while waiting
    sendBtn.disabled = false;
    draw();
    // Scroll to the START of the new reply so it can be read from the top.
    const last = messagesEl.lastElementChild;
    messagesEl.scrollTop = last.offsetTop - messagesEl.offsetTop - 8;
    toLatest.hidden = nearBottom();
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 180) + 'px';
  }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Enter sends, Shift+Enter = new line
      $('#form').requestSubmit();
    }
  });
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    autosize();
    send(text);
  });

  $('#new-chat').addEventListener('click', () => {
    if (busy) return;
    state.chats[key] = [];
    persist();
    app.go({ type: 'chat', id: mode.id });
  });
  $('#proj-select').addEventListener('change', (e) => {
    setActiveProject(e.target.value || null);
    app.go({ type: 'chat', id: mode.id });
  });

  draw();
  scrollToBottom();
  input.focus();
}
