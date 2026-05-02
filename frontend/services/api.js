import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'plxyground_token';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* SecureStore unavailable */ }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync('plxyground_user_type');
      } catch { /* ignore */ }
      // Signal logout to any subscribers
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
