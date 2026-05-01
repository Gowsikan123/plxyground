import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Dimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');
const DEMO_CREATORS = [
  { label: 'Sarah Johnson', email: 'sarahjohnson@plxyground.local', password: 'Password1!' },
  { label: 'Mike Thompson', email: 'mikethompson@plxyground.local', password: 'Password1!' },
  { label: 'Alex Rivera', email: 'alexrivera@plxyground.local', password: 'Password1!' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', 'POST', { email, password });
      await login(data.token, data.user);
      router.replace('/feed');
    } catch (err) {
      if (err.code === 'ACCOUNT_SUSPENDED') setError('Your account has been suspended. Contact support.');
      else setError(err.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.topSection}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>PLXYGROUND</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your creator account</Text>
      </View>

      <View style={styles.card}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#334155"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passWrap}>
          <TextInput
            style={styles.passInput}
            placeholder="••••••••"
            placeholderTextColor="#334155"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Demo creator accounts</Text>
          <Text style={styles.demoSub}>All creator demos use `Password1!`.</Text>
          {DEMO_CREATORS.map((account) => (
            <TouchableOpacity
              key={account.email}
              style={styles.demoBtn}
              onPress={() => fillDemoAccount(account)}
              activeOpacity={0.85}
            >
              <View>
                <Text style={styles.demoBtnTitle}>{account.label}</Text>
                <Text style={styles.demoBtnMeta}>{account.email}</Text>
              </View>
              <Text style={styles.demoBtnAction}>Use</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.altBtn} onPress={() => router.push('/business-login')}>
          <Text style={styles.altBtnText}>🏢  Sign in as a Business</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.footer} onPress={() => router.push('/signup')}>
        <Text style={styles.footerText}>Don't have an account? <Text style={styles.footerLink}>Create one →</Text></Text>
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  topSection: { paddingTop: 60, paddingHorizontal: 28, paddingBottom: 32 },
  backBtn: { marginBottom: 24 },
  backText: { color: '#3b82f6', fontSize: 24 },
  logoWrap: { marginBottom: 24 },
  logo: { color: '#3b82f6', fontSize: 14, fontWeight: '900', letterSpacing: 4 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  sub: { color: '#64748b', fontSize: 15 },
  card: { backgroundColor: '#0f1623', marginHorizontal: 20, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#7f1d1d', padding: 14, borderRadius: 12, marginBottom: 16, gap: 10 },
  errorIcon: { fontSize: 16 },
  errorText: { color: '#f87171', fontSize: 14, flex: 1 },
  label: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#131929', color: '#fff', padding: 16, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#1e293b' },
  passWrap: { flexDirection: 'row', backgroundColor: '#131929', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  passInput: { flex: 1, color: '#fff', padding: 16, fontSize: 15 },
  eyeBtn: { padding: 16 },
  eyeText: { fontSize: 16 },
  btn: { marginTop: 24, borderRadius: 14, overflow: 'hidden', shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  demoCard: { marginTop: 18, backgroundColor: '#131929', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, gap: 10 },
  demoTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  demoSub: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f1623', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 12 },
  demoBtnTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },
  demoBtnMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  demoBtnAction: { color: '#60a5fa', fontSize: 13, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: '#1e293b' },
  dividerText: { color: '#334155', fontSize: 13 },
  altBtn: { borderWidth: 1, borderColor: '#1e293b', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#131929' },
  altBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#3b82f6', fontWeight: '700' },
});
