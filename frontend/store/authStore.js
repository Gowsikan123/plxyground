import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  userType: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userType = await SecureStore.getItemAsync('user_type');
      if (!token || !userType) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const endpoint = userType === 'business' ? ENDPOINTS.BUSINESS_ME : ENDPOINTS.ME;
      const { data, error } = await api.get(endpoint);
      if (error || !data) {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_type');
        set({ isLoading: false, isAuthenticated: false, token: null, user: null, userType: null });
        return;
      }
      set({ token, user: data, userType, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  loginCreator: async (email, password) => {
    const { data, error } = await api.post(ENDPOINTS.LOGIN, { email, password });
    if (error) return { error };
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user_type', 'creator');
    set({ token: data.token, user: data.user, userType: 'creator', isAuthenticated: true });
    return { error: null };
  },

  signupCreator: async (payload) => {
    const { data, error } = await api.post(ENDPOINTS.SIGNUP, payload);
    if (error) return { error };
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user_type', 'creator');
    set({ token: data.token, user: data.user, userType: 'creator', isAuthenticated: true });
    return { error: null };
  },

  loginBusiness: async (email, password) => {
    const { data, error } = await api.post(ENDPOINTS.BUSINESS_LOGIN, { email, password });
    if (error) return { error };
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user_type', 'business');
    set({ token: data.token, user: data.user, userType: 'business', isAuthenticated: true });
    return { error: null };
  },

  signupBusiness: async (payload) => {
    const { data, error } = await api.post(ENDPOINTS.BUSINESS_SIGNUP, payload);
    if (error) return { error };
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user_type', 'business');
    set({ token: data.token, user: data.user, userType: 'business', isAuthenticated: true });
    return { error: null };
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_type');
    set({ token: null, user: null, userType: null, isAuthenticated: false });
  },
}));
