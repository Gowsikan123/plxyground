import api from './api';

async function safeCall(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Request failed' };
  }
}

export const creatorService = {
  search: ({ search = '', sport = '', limit = 20, offset = 0 } = {}) => {
    const params = { limit, offset };
    if (search) params.search = search;
    if (sport)  params.sport  = sport;
    return safeCall(() => api.get('/api/creators', { params }));
  },

  getBySlug: (slug) =>
    safeCall(() => api.get(`/api/creators/slug/${slug}`)),

  getById: (id) =>
    safeCall(() => api.get(`/api/creators/${id}`)),

  updateProfile: (id, fields) =>
    safeCall(() => api.put(`/api/creators/${id}`, fields)),
};
