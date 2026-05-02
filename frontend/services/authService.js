import { apiCall } from './api';

export const creatorSignup = (payload) =>
  apiCall((api) => api.post('/api/auth/signup', payload));

export const creatorLogin = (email, password) =>
  apiCall((api) => api.post('/api/auth/login', { email, password }));

export const creatorMe = () =>
  apiCall((api) => api.get('/api/auth/me'));

export const businessSignup = (payload) =>
  apiCall((api) => api.post('/api/business-auth/signup', payload));

export const businessLogin = (email, password) =>
  apiCall((api) => api.post('/api/business-auth/login', { email, password }));

export const businessMe = () =>
  apiCall((api) => api.get('/api/business-auth/me'));

export const updateBusinessProfile = (payload) =>
  apiCall((api) => api.patch('/api/business-auth/me', payload));
