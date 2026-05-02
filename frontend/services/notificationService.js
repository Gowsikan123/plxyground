import api from './api';

export const notificationService = {
  async getAll() {
    try {
      const { data } = await api.get('/notifications');
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },

  async markRead(id) {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },

  async markAllRead() {
    try {
      const { data } = await api.patch('/notifications/read-all');
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },

  async deleteNotification(id) {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },
};
