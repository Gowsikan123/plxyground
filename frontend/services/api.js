import { API_BASE_URL } from '../constants/envVar';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE_URL}${path}`, options);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (Array.isArray(json.errors) && json.errors[0]?.message) ||
      json.error ||
      json.message ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json;
}

export const api = {
  get: (path, token = null) => request('GET', path, null, token),
  post: (path, body, token = null) => request('POST', path, body, token),
  put: (path, body, token = null) => request('PUT', path, body, token),
  patch: (path, body, token = null) => request('PATCH', path, body, token),
  delete: (path, token = null) => request('DELETE', path, null, token),
};
