import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function CreatorLayout() {
  const router = useRouter();
  const { token, userType } = useAuthStore();

  useEffect(() => {
    if (!token || userType !== 'creator') {
      router.replace('/login');
    }
  }, [token, userType]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="feed" />
      <Stack.Screen name="create" />
      <Stack.Screen name="opportunities" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
