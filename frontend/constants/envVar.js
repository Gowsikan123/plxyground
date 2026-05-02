import Constants from 'expo-constants';

// Pull from app.config.js extra → falls back to localhost for local dev
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  'http://localhost:3011/api';
