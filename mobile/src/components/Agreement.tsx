import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

/** Sign-up checkbox: confirms age and agreement to the terms and privacy notice. */
export function Agreement({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="I'm 16 or over and agree to the Terms of use and Privacy notice"
          onPress={() => onChange(!checked)}
          hitSlop={8}
          style={styles.hit}
        >
          <View style={[styles.box, checked && styles.boxOn]}>
            {checked ? <Text style={styles.tick}>✓</Text> : null}
          </View>
        </Pressable>
        <Text style={styles.text}>
          I'm 16 or over and agree to the{' '}
          <Text style={styles.link} accessibilityRole="link" onPress={() => router.push('/legal/terms')}>Terms of use</Text>
          {' '}and{' '}
          <Text style={styles.link} accessibilityRole="link" onPress={() => router.push('/legal/privacy')}>Privacy notice</Text>.
        </Text>
      </View>
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hit: { minWidth: minTouchSize, minHeight: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  box: {
    width: 24, height: 24, borderRadius: radius.sm / 2, borderWidth: 2, borderColor: colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: colors.accentText, fontWeight: '800', fontSize: 15 },
  text: { ...type.body, color: colors.text, flex: 1 },
  link: { color: colors.accent, textDecorationLine: 'underline' },
  error: { ...type.caption, color: colors.danger },
});
