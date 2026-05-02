import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, userType, token, isLoading, isHydrated, login, logout, setUser } = useAuthStore();
  const router = useRouter();

  const handleLogin = useCallback(
    async (token, user, userType) => {
      await login(token, user, userType);
      if (userType === 'creator') {
        router.replace('/(creator)/feed');
      } else {
        router.replace('/(business)/dashboard');
      }
    },
    [login, router],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/(auth)/login');
  }, [logout, router]);

  return {
    user,
    userType,
    token,
    isLoading,
    isHydrated,
    isCreator: userType === 'creator',
    isBusiness: userType === 'business',
    isLoggedIn: !!token && !!user,
    login: handleLogin,
    logout: handleLogout,
    setUser,
  };
}
