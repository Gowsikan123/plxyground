import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function BusinessLayout() {
  const router = useRouter();
  const { token, userType } = useAuthStore();

  useEffect(() => {
    if (!token || userType !== 'business') {
      router.replace('/business-login');
    }
  }, [token, userType]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="opportunities" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
