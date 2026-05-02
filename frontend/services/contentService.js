import api from './api';

const wrap = async (fn) => {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.error || err.message || 'Unknown error' };
  }
};

export const getFeed = ({ search = '', sport = '', limit = 20, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (sport) params.set('sport', sport);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return wrap(() => api.get(`/api/content?${params.toString()}`));
};

export const getPost = (id) =>
  wrap(() => api.get(`/api/content/${id}`));

export const createPost = ({ title, body, media_url, media_type, tags }) =>
  wrap(() => api.post('/api/content', { title, body, media_url, media_type, tags }));

export const updatePost = (id, data) =>
  wrap(() => api.put(`/api/content/${id}`, data));

export const deletePost = (id) =>
  wrap(() => api.delete(`/api/content/${id}`));

export const getBusinessContent = () =>
  wrap(() => api.get('/api/business/content/mine'));

export const createBusinessContent = ({ title, body, budget_range, target_sport }) =>
  wrap(() => api.post('/api/business/content', { title, body, budget_range, target_sport }));
