import api from './api';

const wrap = async (fn) => {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.error || err.message || 'Unknown error' };
  }
};

export const getOpportunities = ({ search = '', sport = '', limit = 20, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (sport) params.set('sport', sport);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return wrap(() => api.get(`/api/opportunities?${params.toString()}`));
};

export const getOpportunityById = (id) =>
  wrap(() => api.get(`/api/opportunities/${id}`));

export const createOpportunity = (data) =>
  wrap(() => api.post('/api/opportunities', data));

export const updateOpportunity = (id, data) =>
  wrap(() => api.put(`/api/opportunities/${id}`, data));

export const deleteOpportunity = (id) =>
  wrap(() => api.delete(`/api/opportunities/${id}`));
