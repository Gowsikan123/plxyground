import { apiCall } from './api';

export const businessService = {
  getMe: () =>
    apiCall((api) => api.get('/api/business/auth/me')),

  updateAccount: (data) =>
    apiCall((api) => api.patch('/api/business/auth/me', data)),

  getMyContent: (params = {}) =>
    apiCall((api) => api.get('/api/business/content', { params })),

  createContent: (data) =>
    apiCall((api) => api.post('/api/business/content', data)),

  deleteContent: (id) =>
    apiCall((api) => api.delete(`/api/business/content/${id}`)),

  getMyOpportunities: (params = {}) =>
    apiCall((api) =>
      api.get('/api/opportunities', { params: { ...params, type: 'business' } })
    ),
};

export default businessService;
