import { apiCall } from './api';

export const getCreators = (params) =>
  apiCall((api) => api.get('/api/creators', { params }));

export const getCreatorProfile = (slug) =>
  apiCall((api) => api.get(`/api/creators/${slug}`));

// Named service object — used by useProfile hook
export const creatorService = {
  getBySlug: (slugOrId) =>
    apiCall((api) => api.get(`/api/creators/${slugOrId}`)),

  follow: (id) =>
    apiCall((api) => api.post(`/api/creators/${id}/follow`)),

  unfollow: (id) =>
    apiCall((api) => api.delete(`/api/creators/${id}/follow`)),
};
