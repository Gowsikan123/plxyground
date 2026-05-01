import { Stack } from 'expo-router';
import { AuthProvider } from '../components/AuthContext';
import { useAuth } from '../components/AuthContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

const PROTECTED = ['feed', 'create', 'profile', 'settings', 'opportunities'];

function RouteGuard({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const current = segments[0];
    const inBusiness = current === 'business';
    const inAuth = !current || current === 'login' || current === 'signup' ||
      current === 'business-login' || current === 'business-signup' ||
      current === 'terms' || current === 'privacy';

    if (!user && PROTECTED.includes(current)) {
      router.replace('/login');
      return;
    }

    if (user && user.role === 'BUSINESS' && !inBusiness && !inAuth) {
      router.replace('/business/dashboard');
    }
  }, [user, loading, segments]);

  return children;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080C14' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="business-login" />
          <Stack.Screen name="business-signup" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="opportunities" />
          <Stack.Screen name="create" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="business/dashboard" />
          <Stack.Screen name="business/profile" />
          <Stack.Screen name="business/edit-profile" />
          <Stack.Screen name="business/create-post" />
          <Stack.Screen name="business/my-content" />
          <Stack.Screen name="business/search-creators" />
          <Stack.Screen name="business/opportunities" />
          <Stack.Screen name="business/settings" />
        </Stack>
      </RouteGuard>
    </AuthProvider>
  );
}
