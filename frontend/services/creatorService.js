import { apiCall } from './api';

export const getCreators = (params) =>
  apiCall((api) => api.get('/api/creators', { params }));

export const getCreatorProfile = (slug) =>
  apiCall((api) => api.get(`/api/creators/${slug}`));
