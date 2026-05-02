import api from './api';

export const opportunityService = {
  async getOpportunities({ search = '', sport = '', limit = 20, offset = 0 } = {}) {
    try {
      const res = await api.get('/api/opportunities', { params: { search, sport, limit, offset } });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to load opportunities' };
    }
  },

  async getOpportunity(id) {
    try {
      const res = await api.get(`/api/opportunities/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Opportunity not found' };
    }
  },

  async createOpportunity(data) {
    try {
      const res = await api.post('/api/opportunities', data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.errors || err.response?.data?.message || 'Failed to create opportunity' };
    }
  },

  async updateOpportunity(id, data) {
    try {
      const res = await api.put(`/api/opportunities/${id}`, data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to update opportunity' };
    }
  },

  async deleteOpportunity(id) {
    try {
      const res = await api.delete(`/api/opportunities/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to delete opportunity' };
    }
  },
};
