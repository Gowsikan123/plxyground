import { create } from 'zustand';
import { Platform } from 'react-native';

const TOKEN_KEY = 'plxy_auth_token';
const USER_KEY = 'plxy_auth_user';
const ROLE_KEY = 'plxy_auth_role';

// Web-safe storage shim: uses localStorage on web, SecureStore on native
const store = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  role: null,
  isLoading: true,

  hydrate: async () => {
    try {
      const [token, userStr, role] = await Promise.all([
        store.getItem(TOKEN_KEY),
        store.getItem(USER_KEY),
        store.getItem(ROLE_KEY),
      ]);
      const user = userStr ? JSON.parse(userStr) : null;
      set({ token, user, role, isLoading: false });
    } catch {
      set({ token: null, user: null, role: null, isLoading: false });
    }
  },

  signIn: async (token, user, role) => {
    await Promise.all([
      store.setItem(TOKEN_KEY, token),
      store.setItem(USER_KEY, JSON.stringify(user)),
      store.setItem(ROLE_KEY, role),
    ]);
    set({ token, user, role });
  },

  signOut: async () => {
    await Promise.all([
      store.removeItem(TOKEN_KEY),
      store.removeItem(USER_KEY),
      store.removeItem(ROLE_KEY),
    ]);
    set({ token: null, user: null, role: null });
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    set({ user: updated });
    store.setItem(USER_KEY, JSON.stringify(updated));
  },
}));
