import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function request(method, url, data, params) {
  try {
    const res = await client({ method, url, data, params });
    return { data: res.data, error: null };
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.errors?.[0]?.message ||
      err.message ||
      'An unexpected error occurred';
    return { data: null, error: message };
  }
}

export const api = {
  get: (url, params) => request('GET', url, null, params),
  post: (url, data) => request('POST', url, data),
  patch: (url, data) => request('PATCH', url, data),
  delete: (url) => request('DELETE', url),
};

export default api;
