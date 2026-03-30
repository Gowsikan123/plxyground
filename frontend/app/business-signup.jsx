import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';

export default function BusinessSignup() {
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    setError('');
    if (!organizationName || !email || !password) {
      setError('Organization name, email, and password are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/api/business/auth/signup', 'POST', {
        organizationName,
        email,
        password,
        bio: bio || undefined,
        location: location || undefined
      });
      await login(data.token, data.user);
      router.replace('/business/dashboard');
    } catch (err) {
      setError(err.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business Sign Up</Text>
      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
      <TextInput style={styles.input} placeholder="Organization name" placeholderTextColor="#64748b" value={organizationName} onChangeText={setOrganizationName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Bio (optional)" placeholderTextColor="#64748b" value={bio} onChangeText={setBio} />
      <TextInput style={styles.input} placeholder="Location (optional)" placeholderTextColor="#64748b" value={location} onChangeText={setLocation} />
      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/business-login')}><Text style={styles.link}>Already have an account? Log in</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/signup')}><Text style={styles.link}>Creator? Sign up here</Text></TouchableOpacity>
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
