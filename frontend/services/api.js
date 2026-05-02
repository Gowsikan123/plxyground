import axios from 'axios';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl
  || process.env.EXPO_PUBLIC_API_URL
  || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// ---- Request interceptor: attach Bearer token ----
api.interceptors.request.use(
  (config) => {
    // Token is injected at runtime by authStore.setToken()
    if (api._authToken) {
      config.headers.Authorization = `Bearer ${api._authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: normalise errors ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';

    // 401 — token expired or invalid; signal to auth store
    if (status === 401) {
      api._onUnauthorised?.();
    }

    const normalised = new Error(message);
    normalised.status  = status;
    normalised.data    = error.response?.data || null;
    return Promise.reject(normalised);
  }
);

/**
 * Call once during app boot with the stored JWT and an
 * optional callback to run when a 401 is received.
 */
export function configureApi({ token, onUnauthorised }) {
  api._authToken        = token || null;
  api._onUnauthorised   = onUnauthorised || null;
}

export default api;
