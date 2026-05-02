import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const store = useAuthStore();

  const loginCreator = useCallback(
    (email, password) => store.loginCreator(email, password),
    [store.loginCreator]
  );

  const signupCreator = useCallback(
    (fields) => store.signupCreator(fields),
    [store.signupCreator]
  );

  const loginBusiness = useCallback(
    (email, password) => store.loginBusiness(email, password),
    [store.loginBusiness]
  );

  const signupBusiness = useCallback(
    (fields) => store.signupBusiness(fields),
    [store.signupBusiness]
  );

  const logout = useCallback(() => store.logout(), [store.logout]);

  return {
    user:         store.user,
    token:        store.token,
    userType:     store.userType,
    isLoading:    store.isLoading,
    error:        store.error,
    isAuthenticated: !!store.token,
    isCreator:    store.userType === 'creator',
    isBusiness:   store.userType === 'business',
    loginCreator,
    signupCreator,
    loginBusiness,
    signupBusiness,
    logout,
    clearError:   store.clearError,
    updateUser:   store.updateUser,
  };
}
