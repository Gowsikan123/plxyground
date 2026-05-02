import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function useAuth() {
  const { user, token, userType, isLoading, isAuthenticated, setAuth, updateUser, logout } = useAuthStore();

  const creatorLogin = useCallback(async (email, password) => {
    const { data, error } = await authService.creatorLogin(email, password);
    if (data) {
      setAuth(data.token, data.user, 'creator');
    }
    return { data, error };
  }, [setAuth]);

  const businessLogin = useCallback(async (email, password) => {
    const { data, error } = await authService.businessLogin(email, password);
    if (data) {
      setAuth(data.token, data.user, 'business');
    }
    return { data, error };
  }, [setAuth]);

  const creatorSignup = useCallback(async (formData) => {
    const { data, error } = await authService.creatorSignup(formData);
    if (data) {
      setAuth(data.token, data.user, 'creator');
    }
    return { data, error };
  }, [setAuth]);

  const businessSignup = useCallback(async (formData) => {
    const { data, error } = await authService.businessSignup(formData);
    if (data) {
      setAuth(data.token, data.user, 'business');
    }
    return { data, error };
  }, [setAuth]);

  return {
    user,
    token,
    userType,
    isLoading,
    isAuthenticated,
    creatorLogin,
    businessLogin,
    creatorSignup,
    businessSignup,
    updateUser,
    logout,
  };
}
