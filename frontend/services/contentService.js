import api from './api';

async function safeCall(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Request failed' };
  }
}

export const contentService = {
  getFeed: ({ limit = 20, offset = 0, search = '', sport = '' } = {}) => {
    const params = { limit, offset };
    if (search) params.search = search;
    if (sport)  params.sport  = sport;
    return safeCall(() => api.get('/api/content', { params }));
  },

  getPost: (id) =>
    safeCall(() => api.get(`/api/content/${id}`)),

  createPost: (fields) =>
    safeCall(() => api.post('/api/content', fields)),

  updatePost: (id, fields) =>
    safeCall(() => api.put(`/api/content/${id}`, fields)),

  deletePost: (id) =>
    safeCall(() => api.delete(`/api/content/${id}`)),

  getMyContent: ({ limit = 20, offset = 0 } = {}) =>
    safeCall(() => api.get('/api/content/mine', { params: { limit, offset } })),

  getBusinessContent: ({ limit = 20, offset = 0 } = {}) =>
    safeCall(() => api.get('/api/business-auth/content/mine', { params: { limit, offset } })),

  createBusinessContent: (fields) =>
    safeCall(() => api.post('/api/business-auth/content', fields)),

  updateBusinessContent: (id, fields) =>
    safeCall(() => api.put(`/api/business-auth/content/${id}`, fields)),
};
