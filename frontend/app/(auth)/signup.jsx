import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function SignupScreen() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '', confirmPassword: '', bio: '', sportsNiche: '' });
  const [error, setError] = useState('');

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    setError('');
    const { username, displayName, email, password, confirmPassword } = form;
    if (!username || !displayName || !email || !password) { setError('Please fill in all required fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    const { error: err } = await register({ username: username.trim().toLowerCase(), display_name: displayName.trim(), email: email.trim().toLowerCase(), password, bio: form.bio, sports_niche: form.sportsNiche });
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>Join the creator community</Text>
        <View style={styles.form}>
          <Input label="Username *" value={form.username} onChangeText={set('username')} autoCapitalize="none" />
          <Input label="Display Name *" value={form.displayName} onChangeText={set('displayName')} />
          <Input label="Email *" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Sports Niche" value={form.sportsNiche} onChangeText={set('sportsNiche')} placeholder="e.g. Basketball, Football, MMA" />
          <Input label="Bio" value={form.bio} onChangeText={set('bio')} multiline numberOfLines={3} />
          <Input label="Password *" value={form.password} onChangeText={set('password')} secureTextEntry />
          <Input label="Confirm Password *" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </Pressable>
          <View style={styles.switchRow}>
            <Text style={styles.switchHint}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}><Text style={styles.switchLink}>Sign in</Text></Pressable>
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
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: SPACING[4], alignItems: 'center', marginTop: SPACING[2] },
  btnText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchHint: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  switchLink: { ...TYPOGRAPHY.bodySm, color: COLORS.primary, fontWeight: '600' },
});
