import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../utils/haptics';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../components/ApiClient';
import { C, R, GRAD_ACCENT } from '../components/theme';

function AnimatedInput({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, secureEntry, showToggle, onToggleSecure }) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.accent] });

  const onFocus = () => Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onBlur  = () => Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Animated.View style={[s.inputWrap, { borderColor }]}>
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor={C.textFaint}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureEntry}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggleSecure} style={s.eyeBtn} activeOpacity={0.7}>
            <Text style={s.eyeIcon}>{secureEntry ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true); setError('');
    try {
      const data = await apiRequest('/api/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
      await signIn(data.token, data.user, 'CREATOR');
      router.replace('/feed');
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={s.headWrap}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your creator account</Text>
        </View>
        <View style={s.form}>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
          <AnimatedInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <AnimatedInput label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureEntry={!showPw} showToggle onToggleSecure={() => setShowPw(v => !v)} />
          <TouchableOpacity style={s.primaryWrap} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={GRAD_ACCENT} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={s.footerLink}>Join Plxyground</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  scroll:         { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back:           { marginBottom: 32 },
  backText:       { color: C.textMuted, fontSize: 15, fontWeight: '600' },
  headWrap:       { alignItems: 'center', marginBottom: 40 },
  title:          { color: C.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8, textAlign: 'center' },
  sub:            { color: C.textMuted, fontSize: 15, textAlign: 'center' },
  form:           { gap: 16, marginBottom: 32 },
  errorBox:       { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 14, borderRadius: R.md },
  errorText:      { color: C.error, fontSize: 13, fontWeight: '600' },
  field:          { gap: 8 },
  label:          { color: C.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  inputWrap:      { borderWidth: 1.5, borderRadius: R.lg, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center' },
  input:          { flex: 1, padding: 16, color: C.text, fontSize: 15 },
  eyeBtn:         { paddingHorizontal: 14 },
  eyeIcon:        { fontSize: 16 },
  primaryWrap:    { borderRadius: R.xl, overflow: 'hidden', marginTop: 8 },
  primaryBtn:     { paddingVertical: 20, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  footer:         { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText:     { color: C.textMuted, fontSize: 14 },
  footerLink:     { color: C.accent, fontSize: 14, fontWeight: '700' },
});
