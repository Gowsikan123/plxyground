import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { businessSignup } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function BusinessSignup() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [form, setForm] = useState({ email: '', password: '', company_name: '', industry: '', website: '', location: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!form.company_name.trim()) e.company_name = 'Company name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await businessSignup({ ...form, email: form.email.trim() });
    setLoading(false);
    if (error) { setToast({ visible: true, message: error }); return; }
    await signIn(data.token, data.business, 'business');
    router.replace('/(business)/dashboard');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>PLXYGROUND</Text>
      <Text style={styles.heading}>Create Business Account</Text>
      <Input label="Company Name" value={form.company_name} onChangeText={set('company_name')} error={errors.company_name} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
      <Input label="Industry (optional)" value={form.industry} onChangeText={set('industry')} />
      <Input label="Website (optional)" value={form.website} onChangeText={set('website')} keyboardType="url" autoCapitalize="none" />
      <Input label="Location (optional)" value={form.location} onChangeText={set('location')} />
      <Button title="Sign Up" onPress={handleSignup} loading={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => router.push('/(auth)/business-login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
      <Toast message={toast.message} visible={toast.visible} type="error" onHide={() => setToast({ visible: false, message: '' })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[6], gap: Spacing[3] },
  brand: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['2xl'], color: Colors.accent, textAlign: 'center' },
  heading: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text, marginBottom: Spacing[2] },
  btn: { marginTop: Spacing[2] },
  link: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.accent, textAlign: 'center' },
});
