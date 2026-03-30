import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';

export default function BusinessLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/api/business/auth/login', 'POST', { email, password });
      await login(data.token, data.user);
      router.replace('/business/dashboard');
    } catch (err) {
      if (err.code === 'ACCOUNT_SUSPENDED') setError('Your account has been suspended.');
      else setError(err.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business Login</Text>
      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log In</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/business-signup')}><Text style={styles.link}>No account? Sign up as a business</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/login')}><Text style={styles.link}>Creator? Log in here</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#2563eb', textAlign: 'center', marginBottom: 10 },
  errorBox: { backgroundColor: '#450a0a', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#f87171', fontSize: 14 },
});