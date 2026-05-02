import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureApi } from '../services/api';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ─ State ──────────────────────────────────────────────────
      token:       null,
      user:        null,   // creator or business profile
      userType:    null,   // 'creator' | 'business'
      isLoggedIn:  false,
      isLoading:   false,
      error:       null,

      // ─ Internal helpers ─────────────────────────────────────────
      _applySession(token, user, userType) {
        configureApi({
          token,
          onUnauthorised: () => get().logout(),
        });
        set({ token, user, userType, isLoggedIn: true, error: null });
      },

      // ─ Actions ────────────────────────────────────────────────
      async creatorLogin(email, password) {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.creatorLogin({ email, password });
          get()._applySession(token, user, 'creator');
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      async creatorSignup(data) {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.creatorSignup(data);
          get()._applySession(token, user, 'creator');
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      async businessLogin(email, password) {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.businessLogin({ email, password });
          get()._applySession(token, user, 'business');
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      async businessSignup(data) {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.businessSignup(data);
          get()._applySession(token, user, 'business');
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      async refreshProfile() {
        try {
          const { userType } = get();
          const user = userType === 'business'
            ? await authService.businessMe()
            : await authService.creatorMe();
          set({ user });
        } catch {
          // Silent — stale profile is not fatal
        }
      },

      logout() {
        configureApi({ token: null, onUnauthorised: null });
        set({ token: null, user: null, userType: null, isLoggedIn: false, error: null });
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name:    'plxyground-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the token and minimal user info; re-hydrate api on startup.
      partialize: (state) => ({
        token:    state.token,
        user:     state.user,
        userType: state.userType,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          configureApi({
            token: state.token,
            onUnauthorised: () => state.logout(),
          });
          // Mark as logged in after rehydration
          useAuthStore.setState({ isLoggedIn: true });
        }
      },
    }
  )
);

export default useAuthStore;
