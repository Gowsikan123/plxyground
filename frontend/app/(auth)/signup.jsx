import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  async function handleSignup() {
    if (!username || !email || !password) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (password.length < 8) {
      return Alert.alert('Error', 'Password must be at least 8 characters');
    }
    setLoading(true);
    try {
      await register({ username: username.trim(), email: email.toLowerCase().trim(), password });
      router.replace('/(creator)/feed');
    } catch (err) {
      Alert.alert('Sign up failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>PLXYGROUND</Text>
        <Text style={styles.subtitle}>Create your creator account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername}
            autoCapitalize="none" placeholder="@yourname" placeholderTextColor="#888" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor="#888" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword}
            secureTextEntry placeholder="Min. 8 characters" placeholderTextColor="#888" />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry placeholder="Repeat password" placeholderTextColor="#888" />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
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
