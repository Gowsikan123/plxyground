import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!BASE_URL) throw new Error('EXPO_PUBLIC_API_BASE_URL is not set in environment variables');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('plxyground_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* SecureStore unavailable — proceed unauthenticated */ }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

export default api;
