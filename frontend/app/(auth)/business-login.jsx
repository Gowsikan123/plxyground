import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToastStore } from '../../components/ui/Toast';
import { businessLogin } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function BusinessLogin() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const showToast = useToastStore((s) => s.show);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await businessLogin(email.trim(), password);
    setLoading(false);
    if (error) { showToast(error, 'error'); return; }
    await signIn(data.token, data.business, 'business');
    router.replace('/(business)/dashboard');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>PLXYGROUND</Text>
      <Text style={styles.heading}>Business Log In</Text>
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
      <Button title="Log In" onPress={handleLogin} loading={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => router.push('/(auth)/business-signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Log in as Creator instead</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[6], gap: Spacing[4], minHeight: '100%', justifyContent: 'center' },
  brand: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['2xl'], color: Colors.accent, textAlign: 'center' },
  heading: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text, marginBottom: Spacing[2] },
  btn: { marginTop: Spacing[2] },
  link: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.accent, textAlign: 'center' },
});
