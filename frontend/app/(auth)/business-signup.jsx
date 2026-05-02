import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function BusinessSignupScreen() {
  const { registerBusiness, loading } = useAuth();
  const [form, setForm] = useState({ businessName: '', contactName: '', email: '', password: '', confirmPassword: '', website: '', description: '' });
  const [error, setError] = useState('');

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    setError('');
    const { businessName, contactName, email, password, confirmPassword } = form;
    if (!businessName || !contactName || !email || !password) { setError('Please fill in all required fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    const { error: err } = await registerBusiness({ business_name: businessName.trim(), contact_name: contactName.trim(), email: email.trim().toLowerCase(), password, website: form.website, description: form.description });
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>
        <Text style={styles.heading}>Register Business</Text>
        <Text style={styles.sub}>Start finding sports creators to partner with</Text>
        <View style={styles.form}>
          <Input label="Business Name *" value={form.businessName} onChangeText={set('businessName')} />
          <Input label="Contact Name *" value={form.contactName} onChangeText={set('contactName')} />
          <Input label="Business Email *" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Website" value={form.website} onChangeText={set('website')} keyboardType="url" autoCapitalize="none" />
          <Input label="Description" value={form.description} onChangeText={set('description')} multiline numberOfLines={3} />
          <Input label="Password *" value={form.password} onChangeText={set('password')} secureTextEntry />
          <Input label="Confirm Password *" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable style={({ pressed }) => [styles.btnBusiness, pressed && { opacity: 0.8 }]} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Business Account</Text>}
          </Pressable>
          <View style={styles.switchRow}>
            <Text style={styles.switchHint}>Already registered? </Text>
            <Pressable onPress={() => router.push('/(auth)/business-login')}><Text style={styles.switchLink}>Sign in</Text></Pressable>
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
  btnBusiness: { backgroundColor: '#2d6a2d', borderRadius: 14, paddingVertical: SPACING[4], alignItems: 'center', marginTop: SPACING[2] },
  btnText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchHint: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  switchLink: { ...TYPOGRAPHY.bodySm, color: '#5ca85c', fontWeight: '600' },
});
