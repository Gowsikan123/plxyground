import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const TOKEN_KEY = 'plxyground_auth_token';
const TYPE_KEY  = 'plxyground_user_type';

export const useAuthStore = create((set, get) => ({
  token:    null,
  user:     null,
  userType: null, // 'creator' | 'business'
  isLoading: true,
  error:    null,

  init: async () => {
    try {
      const token    = await SecureStore.getItemAsync(TOKEN_KEY);
      const userType = await SecureStore.getItemAsync(TYPE_KEY);
      if (!token || !userType) { set({ isLoading: false }); return; }
      set({ token, userType });
      const { data, error } = await authService.me(token, userType);
      if (error || !data) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(TYPE_KEY);
        set({ token: null, user: null, userType: null, isLoading: false });
      } else {
        set({ user: data, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  loginCreator: async (email, password) => {
    set({ error: null });
    const { data, error } = await authService.creatorLogin(email, password);
    if (error) { set({ error }); return { error }; }
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(TYPE_KEY, 'creator');
    set({ token: data.token, user: data, userType: 'creator', error: null });
    return { data };
  },

  signupCreator: async (fields) => {
    set({ error: null });
    const { data, error } = await authService.creatorSignup(fields);
    if (error) { set({ error }); return { error }; }
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(TYPE_KEY, 'creator');
    set({ token: data.token, user: data, userType: 'creator', error: null });
    return { data };
  },

  loginBusiness: async (email, password) => {
    set({ error: null });
    const { data, error } = await authService.businessLogin(email, password);
    if (error) { set({ error }); return { error }; }
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(TYPE_KEY, 'business');
    set({ token: data.token, user: data, userType: 'business', error: null });
    return { data };
  },

  signupBusiness: async (fields) => {
    set({ error: null });
    const { data, error } = await authService.businessSignup(fields);
    if (error) { set({ error }); return { error }; }
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(TYPE_KEY, 'business');
    set({ token: data.token, user: data, userType: 'business', error: null });
    return { data };
  },

  updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TYPE_KEY);
    set({ token: null, user: null, userType: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
