import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function BusinessLoginScreen() {
  const { loginBusiness, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    const { error: err } = await loginBusiness(email.trim().toLowerCase(), password);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>
        <View style={styles.badge}><Text style={styles.badgeText}>BUSINESS</Text></View>
        <Text style={styles.heading}>Business Sign In</Text>
        <Text style={styles.sub}>Manage partnerships and opportunities</Text>
        <View style={styles.form}>
          <Input label="Business Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable style={({ pressed }) => [styles.btnBusiness, pressed && { opacity: 0.8 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In as Business</Text>}
          </Pressable>
          <View style={styles.switchRow}>
            <Text style={styles.switchHint}>No business account? </Text>
            <Pressable onPress={() => router.push('/(auth)/business-signup')}><Text style={styles.switchLink}>Register</Text></Pressable>
          </View>
          <Pressable style={styles.altLink} onPress={() => router.push('/(auth)/creator-login')}>
            <Text style={styles.altLinkText}>Sign in as a Creator instead →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, padding: SPACING[6], paddingTop: SPACING[12] },
  back: { marginBottom: SPACING[6] },
  backText: { ...TYPOGRAPHY.bodySm, color: COLORS.primary },
  badge: { alignSelf: 'flex-start', backgroundColor: '#1a2a1a', borderRadius: 6, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1], marginBottom: SPACING[3] },
  badgeText: { ...TYPOGRAPHY.labelSm, color: '#5ca85c', letterSpacing: 1.5 },
  heading: { ...TYPOGRAPHY.displaySm, color: COLORS.text, marginBottom: SPACING[1] },
  sub: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, marginBottom: SPACING[8] },
  form: { gap: SPACING[4] },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error },
  btnBusiness: { backgroundColor: '#2d6a2d', borderRadius: 14, paddingVertical: SPACING[4], alignItems: 'center', marginTop: SPACING[2] },
  btnText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchHint: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  switchLink: { ...TYPOGRAPHY.bodySm, color: '#5ca85c', fontWeight: '600' },
  altLink: { alignItems: 'center', marginTop: SPACING[2] },
  altLinkText: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
});
