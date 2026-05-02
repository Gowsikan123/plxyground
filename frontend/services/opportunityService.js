import api from './api';

export const opportunityService = {
  getOpportunities: async ({ search, sport, limit = 20, offset = 0 } = {}) => {
    try {
      const params = { limit, offset };
      if (search) params.search = search;
      if (sport)  params.sport  = sport;
      const res = await api.get('/api/opportunities', { params });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  getOpportunity: async (id) => {
    try {
      const res = await api.get(`/api/opportunities/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  createOpportunity: async (payload) => {
    try {
      const res = await api.post('/api/opportunities', payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  updateOpportunity: async (id, payload) => {
    try {
      const res = await api.put(`/api/opportunities/${id}`, payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  deleteOpportunity: async (id) => {
    try {
      const res = await api.delete(`/api/opportunities/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },
};
