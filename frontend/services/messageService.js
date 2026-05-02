import api from './api';

export const messageService = {
  async getConversations() {
    try {
      const { data } = await api.get('/messages/conversations');
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },

  async getThread(receiverType, receiverId) {
    try {
      const { data } = await api.get(`/messages/${receiverType}/${receiverId}`);
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },

  async send({ receiverType, receiverId, body }) {
    try {
      const { data } = await api.post('/messages', { receiver_type: receiverType, receiver_id: receiverId, body });
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },

  async markRead(messageId) {
    try {
      const { data } = await api.patch(`/messages/${messageId}/read`);
      return { data: data.data, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error ?? e.message };
    }
  },
};
