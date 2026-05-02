import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const TOKEN_KEY = 'plxyground_token';
const USER_KEY  = 'plxyground_user';
const TYPE_KEY  = 'plxyground_user_type';

export const useAuthStore = create((set, get) => ({
  token:    null,
  user:     null,
  userType: null, // 'creator' | 'business'
  isLoading: true,
  error:    null,

  // Rehydrate from SecureStore on app start
  rehydrate: async () => {
    try {
      const [token, userRaw, userType] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(TYPE_KEY),
      ]);
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        set({ token, user, userType, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // Creator login
  creatorLogin: async (email, password) => {
    set({ error: null });
    const { data, error } = await authService.creatorLogin(email, password);
    if (error) { set({ error }); return { error }; }
    await get()._persist(data.token, data.user, 'creator');
    return { data };
  },

  // Creator signup
  creatorSignup: async (payload) => {
    set({ error: null });
    const { data, error } = await authService.creatorSignup(payload);
    if (error) { set({ error }); return { error }; }
    await get()._persist(data.token, data.user, 'creator');
    return { data };
  },

  // Business login
  businessLogin: async (email, password) => {
    set({ error: null });
    const { data, error } = await authService.businessLogin(email, password);
    if (error) { set({ error }); return { error }; }
    await get()._persist(data.token, data.user, 'business');
    return { data };
  },

  // Business signup
  businessSignup: async (payload) => {
    set({ error: null });
    const { data, error } = await authService.businessSignup(payload);
    if (error) { set({ error }); return { error }; }
    await get()._persist(data.token, data.user, 'business');
    return { data };
  },

  // Refresh /me
  refreshUser: async () => {
    const { token, userType } = get();
    if (!token) return;
    const { data, error } = userType === 'business'
      ? await authService.businessMe(token)
      : await authService.creatorMe(token);
    if (!error && data) {
      set({ user: data });
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(TYPE_KEY),
    ]);
    set({ token: null, user: null, userType: null, error: null });
  },

  clearError: () => set({ error: null }),

  // Internal: persist to SecureStore and state
  _persist: async (token, user, userType) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      SecureStore.setItemAsync(TYPE_KEY, userType),
    ]);
    set({ token, user, userType });
  },
}));
