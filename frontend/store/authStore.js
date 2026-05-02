import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'plxyground_token';
const USER_TYPE_KEY = 'plxyground_user_type';

export const useAuthStore = create((set, get) => ({
  user: null,
  userType: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userType = await SecureStore.getItemAsync(USER_TYPE_KEY);
      if (!token || !userType) {
        set({ isHydrated: true, isLoading: false });
        return;
      }
      // Dynamically import to avoid circular deps
      const { getCreatorMe, getBusinessMe } = await import('../services/authService');
      const fn = userType === 'creator' ? getCreatorMe : getBusinessMe;
      const { data, error } = await fn();
      if (error || !data) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_TYPE_KEY);
        set({ user: null, userType: null, token: null, isHydrated: true, isLoading: false });
        return;
      }
      const user = data.user || data.business || data;
      set({ user, userType, token, isHydrated: true, isLoading: false });
    } catch {
      set({ isHydrated: true, isLoading: false });
    }
  },

  login: async (token, user, userType) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_TYPE_KEY, userType);
    set({ token, user, userType });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_TYPE_KEY);
    set({ user: null, userType: null, token: null });
  },

  setUser: (user) => set({ user }),
}));
