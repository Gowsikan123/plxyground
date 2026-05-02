import { create } from 'zustand';
import { api } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'plxy_token';
const USER_KEY = 'plxy_user';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  userType: null, // 'creator' | 'business'
  isLoading: true,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userRaw = await SecureStore.getItemAsync(USER_KEY);
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        set({ token, user, userType: user.userType || 'creator', isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    const { token, user } = data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ ...user, userType: 'creator' }));
    set({ token, user, userType: 'creator' });
  },

  register: async (payload) => {
    const data = await api.post('/auth/register', payload);
    const { token, user } = data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ ...user, userType: 'creator' }));
    set({ token, user, userType: 'creator' });
  },

  businessLogin: async (email, password) => {
    const data = await api.post('/business/auth/login', { email, password });
    const { token, business } = data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ ...business, userType: 'business' }));
    set({ token, user: business, userType: 'business' });
  },

  businessRegister: async (payload) => {
    const data = await api.post('/business/auth/register', payload);
    const { token, business } = data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ ...business, userType: 'business' }));
    set({ token, user: business, userType: 'business' });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {}
    set({ user: null, token: null, userType: null });
  },
}));
