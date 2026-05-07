import Constants from 'expo-constants';

// EXPO_PUBLIC_API_URL works on Vercel web builds (expo export --platform web)
// Constants.expoConfig.extra.apiUrl works on native (iOS/Android)
const ENV_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl;

// Single source of truth for the API base URL.
export const API_BASE_URL = ENV_API_URL || 'http://localhost:3000';

export const ENDPOINTS = {
  // Creator auth
  SIGNUP:           '/api/auth/signup',
  LOGIN:            '/api/auth/login',
  ME:               '/api/auth/me',
  PROFILE:          '/api/auth/profile',
  FORGOT_PASSWORD:  '/api/auth/forgot-password',
  RESET_PASSWORD:   '/api/auth/reset-password',

  // Business auth
  BUSINESS_SIGNUP:  '/api/business/auth/signup',
  BUSINESS_LOGIN:   '/api/business/auth/login',
  BUSINESS_ME:      '/api/business/auth/me',
  BUSINESS_PROFILE: '/api/business/auth/profile',

  // Business resources
  BUSINESS_CONTENT: '/api/business/content',
  BUSINESS_PLAN:    '/api/business-plan',

  // Public resources
  CONTENT:          '/api/content',
  CREATORS:         '/api/creators',
  PARTNERS:         '/api/partners',
  OPPORTUNITIES:    '/api/opportunities',

  // Social
  FOLLOWS:          '/api/follows',
  MESSAGES:         '/api/messages',
  NOTIFICATIONS:    '/api/notifications',

  // Applications
  APPLICATIONS:     '/api/applications',
};
