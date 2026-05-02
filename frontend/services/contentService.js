import api from './api';

export const contentService = {
  async getFeed({ search = '', sport = '', limit = 20, offset = 0 } = {}) {
    try {
      const res = await api.get('/api/content', { params: { search, sport, limit, offset } });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to load feed' };
    }
  },

  async getPost(id) {
    try {
      const res = await api.get(`/api/content/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to load post' };
    }
  },

  async createPost(data) {
    try {
      const res = await api.post('/api/content', data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.errors || err.response?.data?.message || 'Failed to create post' };
    }
  },

  async updatePost(id, data) {
    try {
      const res = await api.put(`/api/content/${id}`, data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to update post' };
    }
  },

  async deletePost(id) {
    try {
      const res = await api.delete(`/api/content/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to delete post' };
    }
  },

  async getMyContent({ limit = 20, offset = 0 } = {}) {
    try {
      const res = await api.get('/api/business-auth/content/mine', { params: { limit, offset } });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to load content' };
    }
  },
};
