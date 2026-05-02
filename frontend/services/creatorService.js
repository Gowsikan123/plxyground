import api from './api';

export const creatorService = {
  getCreators: async ({ search, sport, limit = 20, offset = 0 } = {}) => {
    try {
      const params = { limit, offset };
      if (search) params.search = search;
      if (sport)  params.sport  = sport;
      const res = await api.get('/api/creators', { params });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  getCreatorBySlug: async (slug) => {
    try {
      const res = await api.get(`/api/creators/slug/${slug}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  getCreatorById: async (id) => {
    try {
      const res = await api.get(`/api/creators/id/${id}`);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  updateCreator: async (id, payload) => {
    try {
      const res = await api.put(`/api/creators/${id}`, payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },
};
