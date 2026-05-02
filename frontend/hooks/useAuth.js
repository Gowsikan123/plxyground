import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { token, user, userType, isLoading, error, logout, refreshUser, clearError } = useAuthStore();
  return { token, user, userType, isLoading, error, logout, refreshUser, clearError, isAuthenticated: !!token };
}

export function useProtectedRoute() {
  const { token, userType, isLoading } = useAuthStore();
  const segments  = useSegments();
  const router    = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup     = segments[0] === 'auth';
    const inCreatorGroup  = segments[0] === 'creator';
    const inBusinessGroup = segments[0] === 'business';

    if (!token && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }
    if (token && inAuthGroup) {
      router.replace(userType === 'business' ? '/business/dashboard' : '/creator/feed');
      return;
    }
    if (token && userType === 'creator' && inBusinessGroup) {
      router.replace('/creator/feed');
      return;
    }
    if (token && userType === 'business' && inCreatorGroup) {
      router.replace('/business/dashboard');
    }
  }, [token, userType, isLoading, segments]);
}
