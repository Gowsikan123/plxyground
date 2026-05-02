import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'plxy_auth_token';
const USER_KEY = 'plxy_auth_user';
const ROLE_KEY = 'plxy_auth_role';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  role: null,
  isLoading: true,

  hydrate: async () => {
    try {
      const [token, userStr, role] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(ROLE_KEY),
      ]);
      const user = userStr ? JSON.parse(userStr) : null;
      set({ token, user, role, isLoading: false });
    } catch {
      set({ token: null, user: null, role: null, isLoading: false });
    }
  },

  signIn: async (token, user, role) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      SecureStore.setItemAsync(ROLE_KEY, role),
    ]);
    set({ token, user, role });
  },

  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(ROLE_KEY),
    ]);
    set({ token: null, user: null, role: null });
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    set({ user: updated });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
  },
}));
