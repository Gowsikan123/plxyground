import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../components/ApiClient';
import { C, R, GRAD_LIME } from '../components/theme';

export default function BusinessSignup() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiRequest('/api/business/signup', { method: 'POST', body: { name: name.trim(), email: email.trim().toLowerCase(), password } });
      await signIn(data.token, data.user, 'BUSINESS');
      router.replace('/business/dashboard');
    } catch (e) {
      setError(e.message || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.blobTR} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.headWrap}>
          <LinearGradient colors={GRAD_LIME} style={s.headIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.headIconText}>🚀</Text>
          </LinearGradient>
          <Text style={s.title}>Register Your Brand</Text>
          <Text style={s.sub}>Find creators and post opportunities</Text>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoText}>✅  Post unlimited opportunities</Text>
          <Text style={s.infoText}>✅  Browse 200+ sports creators</Text>
          <Text style={s.infoText}>✅  Manage your brand dashboard</Text>
        </View>

        <View style={s.form}>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <View style={s.field}>
            <Text style={s.label}>Brand / Business Name</Text>
            <TextInput style={s.input} placeholder="e.g. Nike UK" placeholderTextColor={C.textFaint} value={name} onChangeText={setName} autoCapitalize="words" />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Business Email</Text>
            <TextInput style={s.input} placeholder="brand@company.com" placeholderTextColor={C.textFaint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput style={s.input} placeholder="Min. 6 characters" placeholderTextColor={C.textFaint} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={s.primaryWrap} onPress={handleSignup} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={GRAD_LIME} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.primaryBtnText}>{loading ? 'Creating account…' : 'Create Brand Account →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.push('/business-login')}>
            <Text style={s.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  blobTR:         { position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(170,255,0,0.08)' },
  scroll:         { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back:           { marginBottom: 32 },
  backText:       { color: C.textMuted, fontSize: 15, fontWeight: '600' },
  headWrap:       { alignItems: 'center', marginBottom: 28 },
  headIcon:       { width: 72, height: 72, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headIconText:   { fontSize: 32 },
  title:          { color: C.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8, textAlign: 'center' },
  sub:            { color: C.textMuted, fontSize: 15, textAlign: 'center' },
  infoCard:       { backgroundColor: 'rgba(170,255,0,0.07)', borderWidth: 1, borderColor: 'rgba(170,255,0,0.15)', borderRadius: R.xl, padding: 18, marginBottom: 28, gap: 10 },
  infoText:       { color: C.lime, fontSize: 14, fontWeight: '600' },
  form:           { gap: 16, marginBottom: 32 },
  errorBox:       { backgroundColor: C.redDark, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)', padding: 14, borderRadius: R.md },
  errorText:      { color: C.red, fontSize: 13, fontWeight: '600' },
  field:          { gap: 8 },
  label:          { color: C.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  input:          { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: 16, color: C.text, fontSize: 15 },
  primaryWrap:    { borderRadius: R.xl, overflow: 'hidden', marginTop: 8 },
  primaryBtn:     { paddingVertical: 20, alignItems: 'center' },
  primaryBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '900' },
  footer:         { flexDirection: 'row', justifyContent: 'center' },
  footerText:     { color: C.textMuted, fontSize: 14 },
  footerLink:     { color: C.lime, fontSize: 14, fontWeight: '700' },
});
