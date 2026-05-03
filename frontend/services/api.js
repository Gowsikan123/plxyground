import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'plxy_auth_token';
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiCall(request) {
  try {
    const response = await request(api);
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.response?.data?.error || error?.message || 'Something went wrong.',
    };
  }
}

export default api;
