import { getProject, persist, deleteDoc } from '../store.js';
import { docTypeOf } from '../docTypes.js';
import { esc, md, fmtDate, copyText, downloadText, toast } from '../utils.js';

export function renderDoc(el, { projectId, docId, editing = false }, app) {
  const project = getProject(projectId);
  const doc = project?.docs.find((d) => d.id === docId);
  if (!doc) return app.go({ type: 'chat', id: 'requirements' });
  const type = docTypeOf(doc.type);

  el.innerHTML = `
    <section class="panel scroll">
      <header class="panel-head">
        <div class="tile">${type.icon}</div>
        <div class="head-text">
          <p class="crumbs"><a href="#" id="to-project">📁 ${esc(project.name)}</a> › ${esc(type.label)}</p>
          <h2>${esc(doc.title)}</h2>
          <p>Updated ${fmtDate(doc.updatedAt)}</p>
        </div>
      </header>
      <div class="toolbar">
        <button class="ghost" id="copy">⧉ Copy</button>
        <button class="ghost" id="download">⬇ Download .md</button>
        <button class="ghost" id="edit">${editing ? '💾 Save' : '✎ Edit'}</button>
        ${editing ? '<button class="ghost" id="cancel">Cancel</button>' : ''}
        <span class="grow"></span>
        <button class="ghost danger" id="delete">🗑 Delete</button>
      </div>
      <div class="pad">
        ${editing ? `<textarea id="editor" class="editor">${esc(doc.content)}</textarea>` : `<article class="doc-body">${md(doc.content)}</article>`}
      </div>
    </section>`;

  const $ = (s) => el.querySelector(s);
  $('#to-project').addEventListener('click', (e) => { e.preventDefault(); app.go({ type: 'project', id: projectId }); });
  $('#copy').addEventListener('click', async () => toast((await copyText(doc.content)) ? 'Copied to clipboard' : 'Could not copy'));
  $('#download').addEventListener('click', () => downloadText(`${doc.title.replace(/[^\w]+/g, '-').toLowerCase()}.md`, doc.content));
  $('#edit').addEventListener('click', () => {
    if (editing) {
      doc.content = $('#editor').value;
      doc.updatedAt = Date.now();
      persist();
      toast('Saved');
    }
    app.go({ type: 'doc', projectId, docId, editing: !editing });
  });
  $('#cancel')?.addEventListener('click', () => app.go({ type: 'doc', projectId, docId }));
  $('#delete').addEventListener('click', () => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    deleteDoc(projectId, docId);
    app.refreshSidebar();
    app.go({ type: 'project', id: projectId });
  });
}
