import { businessLogin, businessMe, businessSignup, updateBusinessProfile } from './authService';
import { apiCall } from './api';

export const businessAuthService = {
  signup: businessSignup,
  login: businessLogin,
  me: businessMe,
  updateProfile: updateBusinessProfile,
  createContent: async (payload) => {
    const result = await apiCall((api) => api.post('/api/business/content', payload));
    return { data: result.data?.data || null, error: result.error };
  },
  getMyContent: async () => {
    const result = await apiCall((api) => api.get('/api/business/content/mine'));
    return { data: result.data?.data || null, error: result.error };
  },
  updateContent: async (id, payload) => {
    const result = await apiCall((api) => api.put(`/api/business/content/${id}`, payload));
    return { data: result.data?.data || null, error: result.error };
  },
};
