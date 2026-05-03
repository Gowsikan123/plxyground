import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { ToastContainer } from '../components/ui/Toast';
import { C } from '../components/theme';

export default function RootLayout() {
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    if (hydrate) hydrate();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: 'slide_from_right',
        }}
      />
      <ToastContainer />
    </View>
  );
}
