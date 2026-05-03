import { apiCall } from './api';

export const businessService = {
  async getMe() {
    const result = await apiCall((api) => api.get('/api/business/auth/me'));
    return { data: result.data?.data || null, error: result.error };
  },

  async updateAccount(data) {
    const result = await apiCall((api) => api.patch('/api/business/auth/me', data));
    return { data: result.data?.data || null, error: result.error };
  },

  async getMyContent() {
    const result = await apiCall((api) => api.get('/api/business/content/mine'));
    return { data: result.data?.data || null, error: result.error };
  },

  async createContent(data) {
    const result = await apiCall((api) => api.post('/api/business/content', data));
    return { data: result.data?.data || null, error: result.error };
  },

  async deleteContent(id) {
    const result = await apiCall((api) => api.delete(`/api/business/content/${id}`));
    return { data: result.data || null, error: result.error };
  },

  async getMyOpportunities() {
    const result = await apiCall((api) => api.get('/api/opportunities/mine/list'));
    return { data: result.data?.data || null, error: result.error };
  },
};

export default businessService;
