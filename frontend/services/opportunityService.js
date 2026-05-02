import api from './api';

async function safeCall(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Request failed' };
  }
}

export const opportunityService = {
  getAll: ({ search = '', sport = '', limit = 20, offset = 0 } = {}) => {
    const params = { limit, offset };
    if (search) params.search = search;
    if (sport)  params.sport  = sport;
    return safeCall(() => api.get('/api/opportunities', { params }));
  },

  getOne: (id) =>
    safeCall(() => api.get(`/api/opportunities/${id}`)),

  create: (fields) =>
    safeCall(() => api.post('/api/opportunities', fields)),

  update: (id, fields) =>
    safeCall(() => api.put(`/api/opportunities/${id}`, fields)),

  remove: (id) =>
    safeCall(() => api.delete(`/api/opportunities/${id}`)),
};
