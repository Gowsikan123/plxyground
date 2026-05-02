import api from './api';

export const contentService = {
  getFeed: async ({ limit = 20, offset = 0, search, sport, tags } = {}) => {
    try {
      const params = { limit, offset };
      if (search) params.search = search;
      if (sport)  params.sport  = sport;
      if (tags)   params.tags   = tags;
      const res = await api.get('/api/content', { params });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  getPost: async (id) => {
    try {
      const res = await api.get(`/api/content/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  createPost: async (payload) => {
    try {
      const res = await api.post('/api/content', payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  updatePost: async (id, payload) => {
    try {
      const res = await api.put(`/api/content/${id}`, payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  deletePost: async (id) => {
    try {
      const res = await api.delete(`/api/content/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },
};
