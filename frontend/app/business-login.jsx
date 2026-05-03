import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../components/ApiClient';
import { C, R, GRAD_LIME } from '../components/theme';

export default function BusinessLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiRequest('/api/business/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
      await signIn(data.token, data.user, 'BUSINESS');
      router.replace('/business/dashboard');
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.blobTL} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.headWrap}>
          <LinearGradient colors={GRAD_LIME} style={s.headIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.headIconText}>🏢</Text>
          </LinearGradient>
          <Text style={s.title}>Brand Portal</Text>
          <Text style={s.sub}>Sign in to your brand account</Text>
          <View style={s.brandBadge}>
            <Text style={s.brandBadgeText}>🤝 For Brands & Sponsors</Text>
          </View>
        </View>

        <View style={s.form}>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <View style={s.field}>
            <Text style={s.label}>Business Email</Text>
            <TextInput style={s.input} placeholder="brand@company.com" placeholderTextColor={C.textFaint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput style={s.input} placeholder="Your password" placeholderTextColor={C.textFaint} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={s.primaryWrap} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={GRAD_LIME} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In to Brand Portal →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>New brand? </Text>
          <TouchableOpacity onPress={() => router.push('/business-signup')}>
            <Text style={s.footerLink}>Register here</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.creatorLink} onPress={() => router.push('/login')}>
          <Text style={s.creatorLinkText}>← Back to Creator Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  blobTL:         { position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(170,255,0,0.08)' },
  scroll:         { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back:           { marginBottom: 32 },
  backText:       { color: C.textMuted, fontSize: 15, fontWeight: '600' },
  headWrap:       { alignItems: 'center', marginBottom: 40 },
  headIcon:       { width: 72, height: 72, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headIconText:   { fontSize: 32 },
  title:          { color: C.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8, textAlign: 'center' },
  sub:            { color: C.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  brandBadge:     { backgroundColor: 'rgba(170,255,0,0.10)', borderWidth: 1, borderColor: 'rgba(170,255,0,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full },
  brandBadgeText: { color: C.lime, fontSize: 13, fontWeight: '700' },
  form:           { gap: 16, marginBottom: 32 },
  errorBox:       { backgroundColor: C.redDark, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)', padding: 14, borderRadius: R.md },
  errorText:      { color: C.red, fontSize: 13, fontWeight: '600' },
  field:          { gap: 8 },
  label:          { color: C.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  input:          { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: 16, color: C.text, fontSize: 15 },
  primaryWrap:    { borderRadius: R.xl, overflow: 'hidden', marginTop: 8 },
  primaryBtn:     { paddingVertical: 20, alignItems: 'center' },
  primaryBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '900' },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  footerText:     { color: C.textMuted, fontSize: 14 },
  footerLink:     { color: C.lime, fontSize: 14, fontWeight: '700' },
  creatorLink:    { alignItems: 'center' },
  creatorLinkText:{ color: C.textMuted, fontSize: 13 },
});
