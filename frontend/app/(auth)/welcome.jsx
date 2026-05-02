import { View, Text, StyleSheet, Pressable, Image, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo / Brand */}
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.wordmark}>PLXYGROUND</Text>
        <Text style={styles.tagline}>Where creators meet opportunity</Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => router.push('/(auth)/creator-login')}
        >
          <Text style={styles.btnPrimaryText}>I'm a Creator</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => router.push('/(auth)/business-login')}
        >
          <Text style={styles.btnSecondaryText}>I'm a Business</Text>
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>New creator? </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>Sign up free</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING[16] },
  logoMark: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING[4],
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  logoLetter: { ...TYPOGRAPHY.displayLg, color: '#fff', lineHeight: 56 },
  wordmark: { ...TYPOGRAPHY.displaySm, color: COLORS.text, letterSpacing: 4, marginBottom: SPACING[2] },
  tagline: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, textAlign: 'center' },
  actions: { padding: SPACING[6], paddingBottom: SPACING[12], gap: SPACING[3] },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: SPACING[4], alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
  btnSecondary: {
    borderRadius: 14, paddingVertical: SPACING[4], alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  btnSecondaryText: { ...TYPOGRAPHY.labelLg, color: COLORS.text },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING[2] },
  signupHint: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  signupLink: { ...TYPOGRAPHY.bodySm, color: COLORS.primary, fontWeight: '600' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
