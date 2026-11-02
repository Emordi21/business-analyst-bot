import { ask } from '../api.js';
import { BASE } from '../modes.js';
import { DOC_TYPES, docTypeOf } from '../docTypes.js';
import { state, persist, getProject, setActiveProject, deleteProject, addDoc, projectBrief } from '../store.js';
import { esc, fmtDate, toast, tracker } from '../utils.js';

export function renderProject(el, { id }, app) {
  const project = getProject(id);
  if (!project) return app.go({ type: 'chat', id: 'requirements' });
  const alive = tracker(el);
  setActiveProject(project.id);

  el.innerHTML = `
    <section class="panel scroll">
      <header class="panel-head">
        <div class="tile">📁</div>
        <div class="head-text"><h2>${esc(project.name)}</h2><p>${project.docs.length} document${project.docs.length === 1 ? '' : 's'} · created ${fmtDate(project.createdAt)}</p></div>
        <button class="ghost danger" id="delete" type="button">🗑 Delete</button>
      </header>
      <div class="pad stack">
        <details class="card" ${project.context ? '' : 'open'}>
          <summary>Project details <span class="dim">(the AI uses this in every answer)</span></summary>
          <form id="details" class="stack">
            <label>Name<input name="name" required maxlength="80" value="${esc(project.name)}" /></label>
            <label>Context<textarea name="context" rows="6" placeholder="Goals, stakeholders, systems, constraints, timeline, budget…">${esc(project.context)}</textarea></label>
            <button class="primary" type="submit">Save details</button>
          </form>
        </details>

        <div>
          <h3>✨ Generate a document</h3>
          <label>Extra instructions <span class="dim">(optional)</span>
            <input id="extra" placeholder="e.g. Target audience is the exec board; keep it to two pages" />
          </label>
          <div class="doc-grid" id="doc-grid">
            ${DOC_TYPES.map((d) => `<button type="button" class="doc-card" data-type="${d.id}"><span class="ico">${d.icon}</span><b>${esc(d.label)}</b></button>`).join('')}
          </div>
          ${project.context ? '' : '<p class="dim">⚠️ Add project context above first, so the documents are specific to your project.</p>'}
        </div>

        <div>
          <h3>🗂 Documents</h3>
          ${project.docs.length
            ? `<ul class="doc-list">${project.docs.map((d) => `<li><button type="button" data-doc="${d.id}"><span class="ico">${docTypeOf(d.type).icon}</span><span class="grow"><b>${esc(d.title)}</b><small class="dim">${esc(docTypeOf(d.type).label)} · ${fmtDate(d.updatedAt)}</small></span>›</button></li>`).join('')}</ul>`
            : '<p class="dim">No documents yet. Pick one above and the AI will draft it from your project context.</p>'}
        </div>
      </div>
    </section>`;

  el.querySelector('#details').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    project.name = f.get('name').trim();
    project.context = f.get('context').trim();
    persist();
    app.refreshSidebar();
    toast('Project saved');
    app.go({ type: 'project', id });
  });

  el.querySelector('#delete').addEventListener('click', () => {
    if (!confirm(`Delete "${project.name}" and all its documents? This cannot be undone.`)) return;
    deleteProject(project.id);
    app.go({ type: 'chat', id: 'requirements' });
  });

  el.querySelectorAll('[data-doc]').forEach((b) => b.addEventListener('click', () => app.go({ type: 'doc', projectId: id, docId: b.dataset.doc })));

  el.querySelector('#doc-grid').addEventListener('click', async (e) => {
    const card = e.target.closest('.doc-card');
    if (!card) return;
    const type = DOC_TYPES.find((d) => d.id === card.dataset.type);
    const grid = el.querySelector('#doc-grid');
    grid.classList.add('busy');
    card.classList.add('loading');
    card.querySelector('b').textContent = 'Writing…';
    try {
      const extra = el.querySelector('#extra').value.trim();
      const system = `${BASE}\nTask: produce a complete, professional project document.\nDocument type: ${type.label}.\nInclude: ${type.prompt}\nUse [TBC] for facts not in the project context; never invent names, figures or dates. Start with a single # title line.` + projectBrief(project, { excludeType: type.id });
      const content = await ask({ system, messages: [{ role: 'user', content: `Create the ${type.label} for this project.${extra ? ` Extra instructions: ${extra}` : ''}` }] });
      const version = project.docs.filter((d) => d.type === type.id).length + 1;
      const doc = addDoc(project.id, { type: type.id, title: version > 1 ? `${type.label} (v${version})` : type.label, content });
      app.refreshSidebar();
      if (alive()) app.go({ type: 'doc', projectId: project.id, docId: doc.id });
      else toast(`${type.label} is ready in ${project.name}`);
    } catch (err) {
      if (!alive()) return toast(`Could not generate: ${err.message}`);
      grid.classList.remove('busy');
      card.classList.remove('loading');
      card.querySelector('b').textContent = type.label;
      toast(`⚠️ ${err.message}`);
    }
  });
}
