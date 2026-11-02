// The one place the browser talks to our server (/api/chat), which then calls Gemini.
export async function ask({ system, messages, json = false }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, json }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}). Is the /api/chat endpoint running?`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data.text;
}
