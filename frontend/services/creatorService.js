import api from './api';

export const creatorService = {
  async getCreators({ search = '', sport = '', limit = 20, offset = 0 } = {}) {
    try {
      const res = await api.get('/api/creators', { params: { search, sport, limit, offset } });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to load creators' };
    }
  },

  async getCreatorBySlug(slug) {
    try {
      const res = await api.get(`/api/creators/slug/${slug}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Creator not found' };
    }
  },

  async getCreatorById(id) {
    try {
      const res = await api.get(`/api/creators/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Creator not found' };
    }
  },

  async updateProfile(id, data) {
    try {
      const res = await api.put(`/api/creators/${id}`, data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to update profile' };
    }
  },
};
