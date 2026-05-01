import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, S, GRAD_ACCENT } from '../components/theme';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const submit = async () => {
    if (!email.trim() || !password) return setError('Please fill in all fields');
    setLoading(true); setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/feed');
    } catch (e) {
      setError(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <LinearGradient colors={GRAD_ACCENT} style={s.logoMark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.logoMarkText}>P</Text>
            </LinearGradient>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.subtitle}>Sign in to your creator account</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textFaint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.pwWrap}>
                <TextInput
                  style={[s.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="Your password"
                  placeholderTextColor={C.textFaint}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
                  <Text style={s.eyeText}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.forgotWrap}>
              <Text style={s.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.primaryWrap} onPress={submit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={GRAD_ACCENT} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={s.footerLink}>Create one →</Text>
            </TouchableOpacity>
          </View>

          <View style={s.dividerWrap}>
            <View style={s.divider} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.divider} />
          </View>

          <TouchableOpacity style={s.bizBtn} onPress={() => router.push('/business-login')}>
            <Text style={s.bizBtnText}>🏢  Business / Brand Login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  scroll:         { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  back:           { marginBottom: 32 },
  backText:       { color: C.textMuted, fontSize: 15 },
  header:         { alignItems: 'center', marginBottom: 36 },
  logoMark:       { width: 56, height: 56, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoMarkText:   { color: '#fff', fontSize: 30, fontWeight: '900' },
  title:          { color: C.text, fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  subtitle:       { color: C.textMuted, fontSize: 15 },
  errorBox:       { backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#7F1D1D', borderRadius: R.md, padding: 14, marginBottom: 20 },
  errorText:      { color: C.red, fontSize: 14 },
  form:           { gap: 18 },
  field:          { gap: 8 },
  label:          { color: C.textMuted, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  input:          { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 15, color: C.text, fontSize: 16 },
  pwWrap:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingLeft: 16, paddingRight: 8 },
  eyeBtn:         { padding: 10 },
  eyeText:        { fontSize: 18 },
  forgotWrap:     { alignItems: 'flex-end', marginTop: -8 },
  forgot:         { color: C.accent, fontSize: 13, fontWeight: '600' },
  primaryWrap:    { borderRadius: R.md, overflow: 'hidden', marginTop: 8 },
  primaryBtn:     { paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText:     { color: C.textMuted, fontSize: 14 },
  footerLink:     { color: C.accent, fontSize: 14, fontWeight: '700' },
  dividerWrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  divider:        { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:    { color: C.textMuted, fontSize: 13 },
  bizBtn:         { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingVertical: 16, alignItems: 'center' },
  bizBtnText:     { color: C.textMuted, fontSize: 15, fontWeight: '600' },
});
