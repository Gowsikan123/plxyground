import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Button } from '../components/ui/Button';
import { Spacing } from '../constants/spacing';

export default function Welcome() {
  const router = useRouter();
  const { token, role, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && token) {
      if (role === 'business') router.replace('/(business)/dashboard');
      else router.replace('/(creator)/feed');
    }
  }, [isLoading, token, role, router]);

  if (isLoading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>PLXYGROUND</Text>
      <Text style={styles.tagline}>Connect. Create. Compete.</Text>
      <View style={styles.actions}>
        <Button title="Creator Sign Up" onPress={() => router.push('/(auth)/signup')} />
        <Button title="Creator Log In" variant="secondary" onPress={() => router.push('/(auth)/login')} />
        <Button title="Business Sign Up" onPress={() => router.push('/(auth)/business-signup')} />
        <Button title="Business Log In" variant="secondary" onPress={() => router.push('/(auth)/business-login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  brand: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['3xl'], color: Colors.accent, letterSpacing: 2 },
  tagline: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted, marginTop: Spacing[2], marginBottom: Spacing[10] },
  actions: { width: '100%', gap: Spacing[3] },
});
