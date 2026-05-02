import { api, safeCall } from './api';

export const contentService = {
  getFeed: ({ search = '', sport = '', tags = '', limit = 20, offset = 0 } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (sport)  params.sport  = sport;
    if (tags)   params.tags   = tags;
    params.limit  = limit;
    params.offset = offset;
    return safeCall(api.get('/api/content', { params }));
  },

  getPost: (id) =>
    safeCall(api.get(`/api/content/${id}`)),

  createPost: (payload) =>
    safeCall(api.post('/api/content', payload)),

  updatePost: (id, payload) =>
    safeCall(api.put(`/api/content/${id}`, payload)),

  deletePost: (id) =>
    safeCall(api.delete(`/api/content/${id}`)),

  // Business content
  createBusinessContent: (payload) =>
    safeCall(api.post('/api/business-auth/content', payload)),

  getMyBusinessContent: () =>
    safeCall(api.get('/api/business-auth/content/mine')),

  updateBusinessContent: (id, payload) =>
    safeCall(api.put(`/api/business-auth/content/${id}`, payload)),
};
