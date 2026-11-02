// Small helper functions used all over the app.
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Escape user text before putting it into HTML (prevents XSS - "script injection").
export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Markdown -> safe HTML
export const md = (text) => DOMPurify.sanitize(marked.parse(text));

export const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function toast(message) {
  const el = Object.assign(document.createElement('div'), { className: 'toast', textContent: message });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// A view can finish an async job (e.g. an AI reply) after the user has moved to another
// screen. tracker() lets the job ask "is my screen still showing?" before touching the page.
export function tracker(el) {
  const token = el.dataset.token;
  return () => el.dataset.token === token;
}
