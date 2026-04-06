const BASE = '';

async function fetchJson(url) {
  const res = await fetch(BASE + url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function postJson(url, body = {}) {
  const res = await fetch(BASE + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  getAuthStatus: () => fetchJson('/auth/status'),
  getWeather: () => fetchJson('/api/weather'),
  getCalendar: () => fetchJson('/api/calendar'),
  getEmails: () => fetchJson('/api/emails'),
  getTodos: () => fetchJson('/api/todos'),
  getHomework: () => fetchJson('/api/homework'),
  completeTodo: (id, completed) => postJson(`/api/todos/${id}/complete`, { completed }),
  refreshAll: () => Promise.all([
    postJson('/api/weather/refresh'),
    postJson('/api/homework/refresh'),
    postJson('/api/calendar/refresh'),
    postJson('/api/emails/refresh'),
  ]),
};
