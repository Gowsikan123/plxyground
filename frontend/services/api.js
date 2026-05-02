import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not defined. Check your .env file.');
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('plxyground_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* SecureStore unavailable — continue unauthenticated */ }
  return config;
});

// Normalise responses to { data, error }
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Wrap any axios call so it always returns { data, error }.
 * Usage: const { data, error } = await safeCall(api.get('/foo'));
 */
export async function safeCall(promise) {
  try {
    const res = await promise;
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Request failed' };
  }
}
