import api from './api';
import * as SecureStore from 'expo-secure-store';

export const authService = {
  async creatorSignup(data) {
    try {
      const res = await api.post('/api/auth/signup', data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Signup failed' };
    }
  },

  async creatorLogin(email, password) {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      await SecureStore.setItemAsync('authToken', res.data.token);
      await SecureStore.setItemAsync('authUser', JSON.stringify({ ...res.data.user, type: 'creator' }));
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Login failed' };
    }
  },

  async businessSignup(data) {
    try {
      const res = await api.post('/api/business-auth/signup', data);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Signup failed' };
    }
  },

  async businessLogin(email, password) {
    try {
      const res = await api.post('/api/business-auth/login', { email, password });
      await SecureStore.setItemAsync('authToken', res.data.token);
      await SecureStore.setItemAsync('authUser', JSON.stringify({ ...res.data.user, type: 'business' }));
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Login failed' };
    }
  },

  async getMe(type) {
    try {
      const endpoint = type === 'business' ? '/api/business-auth/me' : '/api/auth/me';
      const res = await api.get(endpoint);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.message || 'Failed to fetch user' };
    }
  },

  async logout() {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('authUser');
  },
};
