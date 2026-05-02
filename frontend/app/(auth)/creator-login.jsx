import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function CreatorLogin() {
  const router = useRouter();
  const { loginCreator } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '', sport: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(field, val) {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: '' }));
  }

  async function submit() {
    setLoading(true);
    const { loginCreator: login, signupCreator: signup } = useAuthStore.getState();
    let result;
    if (mode === 'login') {
      result = await login(form.email, form.password);
    } else {
      result = await signup(form);
    }
    setLoading(false);
    if (result.error) {
      setErrors({ general: result.error });
    } else {
      router.replace('/(tabs)/feed');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Creator {mode === 'login' ? 'Login' : 'Signup'}</Text>
        <View style={styles.toggle}>
          <TouchableOpacity onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.activeTab]}>
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('signup')} style={[styles.tab, mode === 'signup' && styles.activeTab]}>
            <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        {errors.general && <Text style={styles.errorBanner}>{errors.general}</Text>}
        <Input label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" placeholder="you@example.com" error={errors.email} />
        <Input label="Password" value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry placeholder="••••••••" error={errors.password} />
        {mode === 'signup' && (
          <>
            <Input label="Username" value={form.username} onChangeText={(v) => set('username', v)} placeholder="your_username" error={errors.username} />
            <Input label="Display Name" value={form.display_name} onChangeText={(v) => set('display_name', v)} placeholder="Your Name" error={errors.display_name} />
            <Input label="Sport (optional)" value={form.sport} onChangeText={(v) => set('sport', v)} placeholder="e.g. Football" />
          </>
        )}
        <Button title={mode === 'login' ? 'Login' : 'Create Account'} onPress={submit} loading={loading} style={styles.cta} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: Colors.textMuted, fontFamily: 'DMSans_400Regular', fontSize: 15 },
  heading: { color: Colors.text, fontSize: 28, fontFamily: 'Syne_700Bold', marginBottom: 24 },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontFamily: 'DMSans_500Medium', fontSize: 14 },
  activeTabText: { color: '#fff' },
  errorBanner: { color: Colors.error, backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, fontSize: 13, fontFamily: 'DMSans_400Regular', marginBottom: 16 },
  cta: { marginTop: 8 },
});
