import api from './api';

const wrap = async (fn) => {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.error || err.message || 'Unknown error' };
  }
};

export const getCreators = ({ search = '', sport = '', limit = 20, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (sport) params.set('sport', sport);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return wrap(() => api.get(`/api/creators?${params.toString()}`));
};

export const getCreatorById = (id) =>
  wrap(() => api.get(`/api/creators/${id}`));

export const getCreatorBySlug = (slug) =>
  wrap(() => api.get(`/api/creators/slug/${slug}`));

export const updateCreatorProfile = (id, data) =>
  wrap(() => api.put(`/api/creators/${id}`, data));
