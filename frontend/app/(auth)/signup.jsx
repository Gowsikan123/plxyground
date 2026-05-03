import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToastStore } from '../../components/ui/Toast';
import { creatorSignup } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function Signup() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const showToast = useToastStore((s) => s.show);
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '', sport: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!form.username.trim() || form.username.length < 3) e.username = 'Username must be at least 3 characters.';
    if (!form.display_name.trim()) e.display_name = 'Display name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await creatorSignup({ ...form, email: form.email.trim() });
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    await signIn(data.token, data.creator, 'creator');
    router.replace('/(creator)/feed');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>PLXYGROUND</Text>
      <Text style={styles.heading}>Create Creator Account</Text>
      <Input label="Display Name" value={form.display_name} onChangeText={set('display_name')} error={errors.display_name} />
      <Input label="Username" value={form.username} onChangeText={set('username')} autoCapitalize="none" error={errors.username} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
      <Input label="Sport (optional)" value={form.sport} onChangeText={set('sport')} />
      <Input label="Location (optional)" value={form.location} onChangeText={set('location')} />
      <Button title="Sign Up" onPress={handleSignup} loading={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
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
