import { apiCall } from './api';

export const getOpportunities = async ({ offset = 0, limit = 20, sport = '', search = '' } = {}) => {
  const result = await apiCall((api) =>
    api.get('/api/opportunities', {
      params: { offset, limit, ...(sport ? { sport } : {}), ...(search ? { search } : {}) },
    })
  );
  return { data: result.data?.data || null, error: result.error };
};

export const getMyOpportunities = async () => {
  const result = await apiCall((api) => api.get('/api/opportunities/mine/list'));
  return { data: result.data?.data || null, error: result.error };
};

export const getOpportunity = async (id) => {
  const result = await apiCall((api) => api.get(`/api/opportunities/${id}`));
  return { data: result.data?.data || null, error: result.error };
};

export const createOpportunity = async (payload) => {
  const result = await apiCall((api) => api.post('/api/opportunities', payload));
  return { data: result.data?.data || null, error: result.error };
};

export const updateOpportunity = async (id, payload) => {
  const result = await apiCall((api) => api.put(`/api/opportunities/${id}`, payload));
  return { data: result.data?.data || null, error: result.error };
};

export const deleteOpportunity = async (id) => {
  const result = await apiCall((api) => api.delete(`/api/opportunities/${id}`));
  return { data: result.data || null, error: result.error };
};

export const opportunityService = {
  getOpportunities,
  getMyOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
};
