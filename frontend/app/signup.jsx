import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, GRAD_ACCENT } from '../components/theme';

export default function Signup() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { signup } = useAuth();
  const router = useRouter();

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) return setError('Please fill in all fields');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true); setError('');
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/feed');
    } catch (e) {
      setError(e.message || 'Could not create account. Try a different email.');
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
            <Text style={s.title}>Create account</Text>
            <Text style={s.subtitle}>Join the sports creator network</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Display Name</Text>
              <TextInput style={s.input} placeholder="Your creator name" placeholderTextColor={C.textFaint} value={name} onChangeText={setName} autoCorrect={false} />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={C.textFaint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.pwWrap}>
                <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} placeholder="Min. 8 characters" placeholderTextColor={C.textFaint} value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
                  <Text style={s.eyeText}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={s.terms}>
              By joining you agree to our{' '}
              <Text style={s.termsLink} onPress={() => router.push('/terms')}>Terms</Text>
              {' '}and{' '}
              <Text style={s.termsLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
            </Text>

            <TouchableOpacity style={s.primaryWrap} onPress={submit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={GRAD_ACCENT} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={s.footerLink}>Sign in →</Text>
            </TouchableOpacity>
          </View>

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
  terms:          { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  termsLink:      { color: C.accent, fontWeight: '600' },
  primaryWrap:    { borderRadius: R.md, overflow: 'hidden', marginTop: 8 },
  primaryBtn:     { paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer:         { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText:     { color: C.textMuted, fontSize: 14 },
  footerLink:     { color: C.accent, fontSize: 14, fontWeight: '700' },
});
