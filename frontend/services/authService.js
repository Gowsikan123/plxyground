import api from './api';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function safeCall(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Request failed' };
  }
}

export const authService = {
  creatorSignup: (fields) =>
    safeCall(() => api.post('/api/auth/signup', fields)),

  creatorLogin: (email, password) =>
    safeCall(() => api.post('/api/auth/login', { email, password })),

  businessSignup: (fields) =>
    safeCall(() => api.post('/api/business-auth/signup', fields)),

  businessLogin: (email, password) =>
    safeCall(() => api.post('/api/business-auth/login', { email, password })),

  me: async (token, userType) => {
    const endpoint = userType === 'business' ? '/api/business-auth/me' : '/api/auth/me';
    return safeCall(() =>
      axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  },
};
