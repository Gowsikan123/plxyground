import { API_BASE_URL, ENDPOINTS } from '../constants/api';

/**
 * Central API service — all fetch calls go through here.
 * Uses API_BASE_URL from constants/api.js (single source of truth).
 *
 * Usage:
 *   import api from '../services/api';
 *   const data = await api.get(ENDPOINTS.CREATORS);
 *   const result = await api.post(ENDPOINTS.LOGIN, { email, password });
 */

const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

const api = {
  get:    (path, token)        => request('GET',    path, null, token),
  post:   (path, body, token)  => request('POST',   path, body, token),
  put:    (path, body, token)  => request('PUT',    path, body, token),
  patch:  (path, body, token)  => request('PATCH',  path, body, token),
  delete: (path, token)        => request('DELETE', path, null, token),
};

export default api;
export { API_BASE_URL, ENDPOINTS };
