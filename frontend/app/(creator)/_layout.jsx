import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

/**
 * Creator section uses a Stack navigator.
 * Navigation between Feed / Opportunities / Create / Profile / Settings
 * is handled by the custom <BottomNav /> component rendered inside each screen.
 * This avoids the duplicate-navigator conflict that was causing the
 * colour-scheme flash on refresh.
 */
export default function CreatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="feed" />
      <Stack.Screen name="opportunities" />
      <Stack.Screen name="create" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
