import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    const { error: err } = await login(email.trim().toLowerCase(), password);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your creator account</Text>

        <View style={styles.form}>
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchHint}>No account? </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.switchLink}>Create one</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, padding: SPACING[6], paddingTop: SPACING[12] },
  back: { marginBottom: SPACING[8] },
  backText: { ...TYPOGRAPHY.bodySm, color: COLORS.primary },
  heading: { ...TYPOGRAPHY.displaySm, color: COLORS.text, marginBottom: SPACING[1] },
  sub: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, marginBottom: SPACING[8] },
  form: { gap: SPACING[4] },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: SPACING[4], alignItems: 'center', marginTop: SPACING[2],
  },
  btnText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchHint: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  switchLink: { ...TYPOGRAPHY.bodySm, color: COLORS.primary, fontWeight: '600' },
});
