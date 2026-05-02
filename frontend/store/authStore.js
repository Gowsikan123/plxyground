import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { businessAuthService } from '../services/businessAuthService';

const AUTH_TOKEN_KEY   = 'plxyground_token';
const AUTH_USER_KEY    = 'plxyground_user';
const AUTH_TYPE_KEY    = 'plxyground_user_type';

export const useAuthStore = create((set, get) => ({
  token:    null,
  user:     null,
  userType: null, // 'creator' | 'business'
  isLoading: true,
  error:    null,

  hydrate: async () => {
    try {
      const [token, userRaw, userType] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(AUTH_USER_KEY),
        SecureStore.getItemAsync(AUTH_TYPE_KEY),
      ]);
      if (token && userRaw) {
        set({ token, user: JSON.parse(userRaw), userType, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  loginCreator: async (email, password) => {
    set({ error: null });
    const { data, error } = await authService.login(email, password);
    if (error) { set({ error }); return { error }; }
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token),
      SecureStore.setItemAsync(AUTH_USER_KEY,  JSON.stringify(data.user)),
      SecureStore.setItemAsync(AUTH_TYPE_KEY,  'creator'),
    ]);
    set({ token: data.token, user: data.user, userType: 'creator', error: null });
    return { data };
  },

  signupCreator: async (payload) => {
    set({ error: null });
    const { data, error } = await authService.signup(payload);
    if (error) { set({ error }); return { error }; }
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token),
      SecureStore.setItemAsync(AUTH_USER_KEY,  JSON.stringify(data.user)),
      SecureStore.setItemAsync(AUTH_TYPE_KEY,  'creator'),
    ]);
    set({ token: data.token, user: data.user, userType: 'creator', error: null });
    return { data };
  },

  loginBusiness: async (email, password) => {
    set({ error: null });
    const { data, error } = await businessAuthService.login(email, password);
    if (error) { set({ error }); return { error }; }
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token),
      SecureStore.setItemAsync(AUTH_USER_KEY,  JSON.stringify(data.user)),
      SecureStore.setItemAsync(AUTH_TYPE_KEY,  'business'),
    ]);
    set({ token: data.token, user: data.user, userType: 'business', error: null });
    return { data };
  },

  signupBusiness: async (payload) => {
    set({ error: null });
    const { data, error } = await businessAuthService.signup(payload);
    if (error) { set({ error }); return { error }; }
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token),
      SecureStore.setItemAsync(AUTH_USER_KEY,  JSON.stringify(data.user)),
      SecureStore.setItemAsync(AUTH_TYPE_KEY,  'business'),
    ]);
    set({ token: data.token, user: data.user, userType: 'business', error: null });
    return { data };
  },

  refreshUser: async () => {
    const { token, userType } = get();
    if (!token) return;
    const svc = userType === 'business' ? businessAuthService : authService;
    const { data, error } = await svc.me();
    if (!error && data) {
      const updated = { ...get().user, ...data };
      await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(updated));
      set({ user: updated });
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AUTH_USER_KEY),
      SecureStore.deleteItemAsync(AUTH_TYPE_KEY),
    ]);
    set({ token: null, user: null, userType: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
