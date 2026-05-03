import { apiCall } from './api';

export const messageService = {
  getConversations: () =>
    apiCall((api) => api.get('/api/messages/conversations')),

  getThread: (receiverType, receiverId) =>
    apiCall((api) => api.get(`/api/messages/${receiverType}/${receiverId}`)),

  send: ({ receiverType, receiverId, body }) =>
    apiCall((api) =>
      api.post('/api/messages', {
        receiver_type: receiverType,
        receiver_id: receiverId,
        body,
      })
    ),

  markRead: (messageId) =>
    apiCall((api) => api.patch(`/api/messages/${messageId}/read`)),
};
