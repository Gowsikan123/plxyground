import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function BusinessLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const businessLogin = useAuthStore((s) => s.businessLogin);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await businessLogin(email.toLowerCase().trim(), password);
      router.replace('/(business)/dashboard');
    } catch (err) {
      Alert.alert('Login failed', err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>PLXYGROUND</Text>
      <Text style={styles.subtitle}>Business Portal</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Business Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" placeholder="business@company.com" placeholderTextColor="#888" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholder="Your password" placeholderTextColor="#888" />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In as Business</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/business-signup')}>
          <Text style={styles.link}>Register your business</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.link}>Creator login →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 2, marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  form: { gap: 12 },
  label: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: -4 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: '#7c3aed', textAlign: 'center', fontSize: 14, marginTop: 8 },
});
