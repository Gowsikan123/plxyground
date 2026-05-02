import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('plxy_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiCall(fn) {
  try {
    const res = await fn(api);
    return { data: res.data, error: null };
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'An unexpected error occurred.';
    return { data: null, error: msg };
  }
}

export default api;
