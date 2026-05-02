import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

/**
 * Redirect to login if user is not authenticated.
 * @param {'creator'|'business'|null} requiredType - if set, also enforces the user type
 */
export function useRequireAuth(requiredType = null) {
  const { user, token, userType, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      if (requiredType === 'business') {
        router.replace('/(auth)/business-login');
      } else {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (requiredType && userType !== requiredType) {
      if (userType === 'business') {
        router.replace('/(business)/dashboard');
      } else {
        router.replace('/(creator)/feed');
      }
    }
  }, [isLoading, token, user, userType, requiredType]);

  return { user, token, userType, isLoading };
}
