import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/store';
import { CenteredState, Loading, Screen } from '@/components/ui';
import { colors } from '@/theme/tokens';

/**
 * Shown instead of a white screen if a screen crashes while rendering.
 * Expo Router picks this up because it's exported from the layout.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <Screen>
        <CenteredState
          title="Something went wrong"
          message="That screen hit a problem. Try again, and if it keeps happening, restart the app."
          action={{ label: 'Try again', onPress: () => void retry() }}
        />
      </Screen>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  const status = useAuth((s) => s.status);
  const restore = useAuth((s) => s.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {status === 'loading' ? (
          <Loading />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Protected guard={status === 'signedOut'}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={status === 'signedIn'}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Screen name="legal/[doc]" options={{ presentation: 'modal' }} />
          </Stack>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
