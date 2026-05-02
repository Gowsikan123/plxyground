import { apiCall } from './api';

export const getFeed = (page = 1, sport) =>
  apiCall((api) => api.get('/api/content', { params: { page, limit: 20, ...(sport ? { sport } : {}) } }));

export const getPost = (id) =>
  apiCall((api) => api.get(`/api/content/${id}`));

export const createPost = (payload) =>
  apiCall((api) => api.post('/api/content', payload));

export const deletePost = (id) =>
  apiCall((api) => api.delete(`/api/content/${id}`));
