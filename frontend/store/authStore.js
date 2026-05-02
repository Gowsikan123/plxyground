import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  userType: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userRaw = await SecureStore.getItemAsync('authUser');
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        set({ token, user, userType: user.type, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setAuth: (token, user, userType) => {
    set({ token, user, userType, isAuthenticated: true });
  },

  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, userType: null, isAuthenticated: false });
  },
}));
