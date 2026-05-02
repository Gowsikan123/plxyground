import api from './api';

export const businessAuthService = {
  signup: async ({ email, password, companyName, industry, website, location }) => {
    try {
      const res = await api.post('/api/business-auth/signup', { email, password, companyName, industry, website, location });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post('/api/business-auth/login', { email, password });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  me: async () => {
    try {
      const res = await api.get('/api/business-auth/me');
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  createContent: async (payload) => {
    try {
      const res = await api.post('/api/business-auth/content', payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  getMyContent: async () => {
    try {
      const res = await api.get('/api/business-auth/content/mine');
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  updateContent: async (id, payload) => {
    try {
      const res = await api.put(`/api/business-auth/content/${id}`, payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },
};
