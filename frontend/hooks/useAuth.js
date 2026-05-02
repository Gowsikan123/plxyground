import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const {
    token, user, userType,
    isLoading, error,
    rehydrate,
    creatorLogin, creatorSignup,
    businessLogin, businessSignup,
    refreshUser, logout, clearError,
  } = useAuthStore();

  useEffect(() => {
    rehydrate();
  }, []);

  const isAuthenticated = Boolean(token && user);
  const isCreator  = isAuthenticated && userType === 'creator';
  const isBusiness = isAuthenticated && userType === 'business';

  return {
    token,
    user,
    userType,
    isLoading,
    error,
    isAuthenticated,
    isCreator,
    isBusiness,
    creatorLogin: useCallback(creatorLogin, []),
    creatorSignup: useCallback(creatorSignup, []),
    businessLogin: useCallback(businessLogin, []),
    businessSignup: useCallback(businessSignup, []),
    refreshUser: useCallback(refreshUser, []),
    logout: useCallback(logout, []),
    clearError: useCallback(clearError, []),
  };
}
