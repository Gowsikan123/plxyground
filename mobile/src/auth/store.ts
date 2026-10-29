import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { configureClient } from '@/api/client';
import { auth } from '@/api/endpoints';
import type { Role, Session } from '@/api/types';

// The token and role live in the iOS Keychain via SecureStore.
// Web preview builds have no Keychain, so they fall back to localStorage.
const STORAGE_KEY = 'plxyground.session';

const storage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    return SecureStore.getItemAsync(STORAGE_KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(STORAGE_KEY, value);
    return SecureStore.setItemAsync(STORAGE_KEY, value);
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(STORAGE_KEY);
    return SecureStore.deleteItemAsync(STORAGE_KEY);
  },
};

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  /** Token used for requests; set before the profile has loaded. */
  token: string | null;
  session: Session | null;
  restore: () => Promise<void>;
  login: (role: Role, email: string, password: string) => Promise<void>;
  signupCreator: (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    sport?: string;
  }) => Promise<void>;
  signupBusiness: (input: {
    email: string;
    password: string;
    companyName: string;
    industry?: string;
  }) => Promise<void>;
  /** Re-fetches the signed-in profile, e.g. after editing it. */
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => {
  async function saveSession(session: Session) {
    await storage.set(JSON.stringify({ role: session.role, token: session.token }));
    set({ status: 'signedIn', token: session.token, session });
  }

  /** Loads the full profile for a token, then saves the session. */
  async function signInWithToken(role: Role, token: string) {
    set({ token });
    if (role === 'creator') {
      await saveSession({ role, token, user: await auth.creatorMe() });
    } else {
      await saveSession({ role, token, user: await auth.businessMe() });
    }
  }

  return {
    status: 'loading',
    token: null,
    session: null,

    restore: async () => {
      try {
        const raw = await storage.get();
        if (!raw) return set({ status: 'signedOut', token: null, session: null });
        const { role, token } = JSON.parse(raw) as { role: Role; token: string };
        await signInWithToken(role, token);
      } catch {
        await storage.clear();
        set({ status: 'signedOut', token: null, session: null });
      }
    },

    login: async (role, email, password) => {
      if (role === 'creator') {
        const { token, user } = await auth.creatorLogin(email.trim(), password);
        await saveSession({ role, token, user });
      } else {
        const { token, business } = await auth.businessLogin(email.trim(), password);
        await saveSession({ role, token, user: business });
      }
    },

    signupCreator: async ({ email, password, username, displayName, sport }) => {
      const { token } = await auth.creatorSignup({
        email: email.trim(),
        password,
        username: username.trim(),
        display_name: displayName.trim(),
        sport,
      });
      // Signup returns a partial profile; fetch the full one with the new token.
      await signInWithToken('creator', token);
    },

    signupBusiness: async ({ email, password, companyName, industry }) => {
      const { token, business } = await auth.businessSignup({
        email: email.trim(),
        password,
        company_name: companyName.trim(),
        industry,
      });
      await saveSession({ role: 'business', token, user: business });
    },

    refreshProfile: async () => {
      const session = get().session;
      if (session) await signInWithToken(session.role, session.token);
    },

    logout: async () => {
      await storage.clear();
      set({ status: 'signedOut', token: null, session: null });
    },
  };
});

configureClient({
  getToken: () => useAuth.getState().token,
  onUnauthorized: () => {
    void useAuth.getState().logout();
  },
});
