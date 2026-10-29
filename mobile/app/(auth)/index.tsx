import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export default function Welcome() {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.brand} accessibilityRole="header">PLXYGROUND</Text>
          <Body muted>Where athletes and creators meet the brands that back them.</Body>
        </View>

        <View style={styles.actions}>
          <Button label="I'm a creator" onPress={() => router.push({ pathname: '/signup', params: { role: 'creator' } })} />
          <View style={{ height: spacing.md }} />
          <Button
            label="I'm a brand"
            variant="secondary"
            onPress={() => router.push({ pathname: '/signup', params: { role: 'business' } })}
          />
          <View style={{ height: spacing.sm }} />
          <Button label="I already have an account" variant="ghost" onPress={() => router.push('/login')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', gap: spacing.md },
  brand: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: 2 },
  actions: { paddingBottom: spacing.lg },
});
