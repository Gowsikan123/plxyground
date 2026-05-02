import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  Syne_400Regular,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { init, isLoading } = useAuthStore();
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function load() {
      await Font.loadAsync({
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_600SemiBold,
        Syne_400Regular,
        Syne_600SemiBold,
        Syne_700Bold,
      });
      setFontsLoaded(true);
      await init();
    }
    load();
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="creator/[slug]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
