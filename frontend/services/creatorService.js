import { apiCall } from './api';

export const getCreators = async (params = {}) => {
  const normalized = { ...params };
  if (normalized.q && !normalized.search) {
    normalized.search = normalized.q;
    delete normalized.q;
  }

  const result = await apiCall((api) => api.get('/api/creators', { params: normalized }));
  return { data: result.data?.data || null, error: result.error };
};

export const getCreatorProfile = async (idOrSlug) => {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const path = isNumeric ? `/api/creators/${idOrSlug}` : `/api/creators/slug/${idOrSlug}`;
  const result = await apiCall((api) => api.get(path));
  return { data: result.data?.data || null, error: result.error };
};

export const updateCreatorProfile = async (id, payload) => {
  const result = await apiCall((api) => api.put(`/api/creators/${id}`, payload));
  return { data: result.data?.data || null, error: result.error };
};

export const creatorService = {
  getCreators,
  getCreatorProfile,
  getBySlug: getCreatorProfile,
  updateCreatorProfile,
  follow: async () => ({ data: null, error: 'Follow is not available yet.' }),
  unfollow: async () => ({ data: null, error: 'Follow is not available yet.' }),
};
