import Constants from 'expo-constants';

const ENV_API_URL = Constants.expoConfig?.extra?.apiUrl;

export const API_BASE_URL = ENV_API_URL || 'http://localhost:3011';

export const ENDPOINTS = {
  // Creator auth
  SIGNUP: '/api/auth/signup',
  LOGIN: '/api/auth/login',
  ME: '/api/auth/me',
  PROFILE: '/api/auth/profile',

  // Business auth
  BUSINESS_SIGNUP: '/api/business/signup',
  BUSINESS_LOGIN: '/api/business/login',
  BUSINESS_ME: '/api/business/me',
  BUSINESS_PROFILE: '/api/business/profile',
  BUSINESS_CONTENT: '/api/business/content',

  // Content
  CONTENT: '/api/content',

  // Creators
  CREATORS: '/api/creators',

  // Opportunities
  OPPORTUNITIES: '/api/opportunities',
};
