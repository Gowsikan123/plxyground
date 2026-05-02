import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

export default function IndexScreen() {
  const { user, userType, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/(auth)/welcome');
    } else if (userType === 'business') {
      router.replace('/(business)/dashboard');
    } else {
      router.replace('/(creator)/feed');
    }
  }, [hydrated, user, userType]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}
