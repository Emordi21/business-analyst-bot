import { state } from '../store.js';
import { docTypeOf } from '../docTypes.js';
import { esc } from '../utils.js';

// Shows a short piece of text around the first match, with the match highlighted.
function snippet(text, terms) {
  const lower = text.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, hit - 50);
  let out = esc(text.slice(start, start + 180).replace(/\s+/g, ' '));
  terms.forEach((t) => (out = out.replace(new RegExp(`(${esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>')));
  return (start > 0 ? '…' : '') + out + '…';
}

export function renderSearch(el, { q }, app) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text) => terms.every((t) => text.toLowerCase().includes(t));

  const projects = state.projects.filter((p) => matches(`${p.name} ${p.context}`));
  const docs = state.projects.flatMap((p) => p.docs.filter((d) => matches(`${d.title} ${d.content}`)).map((d) => ({ p, d })));

  el.innerHTML = `
    <section class="panel scroll">
      <header class="panel-head"><div class="tile">🔎</div><div class="head-text"><h2>Search results</h2><p>${projects.length + docs.length} result${projects.length + docs.length === 1 ? '' : 's'} for “${esc(q)}”</p></div></header>
      <div class="pad stack">
        ${projects.length ? `<h3>Projects</h3><ul class="doc-list">${projects.map((p) => `<li><button data-project="${p.id}"><span class="ico">📁</span><span class="grow"><b>${esc(p.name)}</b><small class="dim">${snippet(p.context || p.name, terms)}</small></span>›</button></li>`).join('')}</ul>` : ''}
        ${docs.length ? `<h3>Documents</h3><ul class="doc-list">${docs.map(({ p, d }) => `<li><button data-project="${p.id}" data-doc="${d.id}"><span class="ico">${docTypeOf(d.type).icon}</span><span class="grow"><b>${esc(d.title)}</b><small class="dim">${esc(p.name)} · ${snippet(d.content, terms)}</small></span>›</button></li>`).join('')}</ul>` : ''}
        ${!projects.length && !docs.length ? '<p class="dim">Nothing found. Try fewer or different words.</p>' : ''}
      </div>
    </section>`;

  el.querySelectorAll('[data-project]').forEach((b) =>
    b.addEventListener('click', () =>
      b.dataset.doc ? app.go({ type: 'doc', projectId: b.dataset.project, docId: b.dataset.doc }) : app.go({ type: 'project', id: b.dataset.project }),
    ),
  );
}
