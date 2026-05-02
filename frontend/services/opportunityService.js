import { apiCall } from './api';

export const getOpportunities = (page = 1, sport) =>
  apiCall((api) => api.get('/api/opportunities', { params: { page, limit: 20, ...(sport ? { sport } : {}) } }));

export const getOpportunity = (id) =>
  apiCall((api) => api.get(`/api/opportunities/${id}`));

export const createOpportunity = (payload) =>
  apiCall((api) => api.post('/api/opportunities', payload));

export const deleteOpportunity = (id) =>
  apiCall((api) => api.delete(`/api/opportunities/${id}`));
