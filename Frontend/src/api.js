const API_BASE = import.meta.env.VITE_API_URL || '';

function authHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function api(path, { token, method = 'GET', body } = {}) {
  const opts = { method, headers: authHeaders(token) };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data === 'string' ? data : data.message || res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data;
}
