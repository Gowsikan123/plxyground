import { api, safeCall } from './api';

export const authService = {
  // Creator
  creatorSignup: (payload) =>
    safeCall(api.post('/api/auth/signup', payload)),

  creatorLogin: (email, password) =>
    safeCall(api.post('/api/auth/login', { email, password })),

  creatorMe: () =>
    safeCall(api.get('/api/auth/me')),

  // Business
  businessSignup: (payload) =>
    safeCall(api.post('/api/business-auth/signup', payload)),

  businessLogin: (email, password) =>
    safeCall(api.post('/api/business-auth/login', { email, password })),

  businessMe: () =>
    safeCall(api.get('/api/business-auth/me')),
};
