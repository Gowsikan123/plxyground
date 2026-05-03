import { apiCall } from './api';

export const creatorSignup = async (payload) => {
  const result = await apiCall((api) => api.post('/api/auth/signup', payload));
  return { data: result.data?.data || null, error: result.error };
};

export const creatorLogin = async (email, password) => {
  const result = await apiCall((api) => api.post('/api/auth/login', { email, password }));
  return { data: result.data?.data || null, error: result.error };
};

export const creatorMe = async () => {
  const result = await apiCall((api) => api.get('/api/auth/me'));
  return { data: result.data?.data || null, error: result.error };
};

export const businessSignup = async (payload) => {
  const result = await apiCall((api) => api.post('/api/business/auth/signup', payload));
  return { data: result.data?.data || null, error: result.error };
};

export const businessLogin = async (email, password) => {
  const result = await apiCall((api) => api.post('/api/business/auth/login', { email, password }));
  return { data: result.data?.data || null, error: result.error };
};

export const businessMe = async () => {
  const result = await apiCall((api) => api.get('/api/business/auth/me'));
  return { data: result.data?.data || null, error: result.error };
};

export const updateBusinessProfile = async (payload) => {
  const result = await apiCall((api) => api.patch('/api/business/auth/me', payload));
  return { data: result.data?.data || null, error: result.error };
};
