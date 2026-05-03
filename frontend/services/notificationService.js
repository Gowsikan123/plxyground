import { apiCall } from './api';

export const notificationService = {
  getAll: () =>
    apiCall((api) => api.get('/api/notifications')),

  markRead: (id) =>
    apiCall((api) => api.patch(`/api/notifications/${id}/read`)),

  markAllRead: () =>
    apiCall((api) => api.patch('/api/notifications/read-all')),

  deleteNotification: (id) =>
    apiCall((api) => api.delete(`/api/notifications/${id}`)),
};
