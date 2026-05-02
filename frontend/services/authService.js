import api from './api';

export const authService = {
  signup: async ({ email, password, username, displayName, sport }) => {
    try {
      const res = await api.post('/api/auth/signup', { email, password, username, displayName, sport });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  me: async () => {
    try {
      const res = await api.get('/api/auth/me');
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },
};
