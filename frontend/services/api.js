import axios from 'axios';
import { Platform } from 'react-native';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://plxyground.vercel.app';

// expo-secure-store cannot be imported at the top level on web —
// it is native-only and blows up before any Platform check runs.
// Use a lazy getter instead so the import only happens on native.
async function getToken() {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem('plxy_auth_token'); } catch { return null; }
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync('plxy_auth_token');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
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
