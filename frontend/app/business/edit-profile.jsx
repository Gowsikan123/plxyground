import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditBusinessProfile() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.replace('/business-login'); return; }
    setLoading(true);
    apiRequest(`/api/creators/${user.id}`, 'GET', null, token)
      .then(data => {
        setBio(data.bio || '');
        setLocation(data.location || '');
        try {
          const links = JSON.parse(data.social_links || '{}');
          setWebsite(links.website || '');
        } catch {}
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await apiRequest(`/api/creators/${user.id}`, 'PUT', {
        bio,
        location,
        social_links: { website }
      }, token);
      setSuccess('Profile updated successfully!');
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setError(err.error || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator color="#3b82f6" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>! {error}</Text></View> : null}
          {success ? <View style={styles.successBox}><Text style={styles.successText}>OK {success}</Text></View> : null}

          <Text style={styles.label}>Organisation Name</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledText}>{user?.name}</Text>
            <Text style={styles.disabledHint}>Contact support to change</Text>
          </View>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe your business..."
            placeholderTextColor="#334155"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. London, UK"
            placeholderTextColor="#334155"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            placeholder="https://yourwebsite.com"
            placeholderTextColor="#334155"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={['#34d399', '#059669']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  backText: { color: '#3b82f6', fontSize: 18 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  label: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#0f1623', color: '#fff', padding: 16, borderRadius: 14, fontSize: 15, borderWidth: 1, borderColor: '#1e293b' },
  textarea: { height: 120, textAlignVertical: 'top', lineHeight: 22 },
  disabledInput: { backgroundColor: '#0a0e1a', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1a2035' },
  disabledText: { color: '#64748b', fontSize: 15 },
  disabledHint: { color: '#334155', fontSize: 11, marginTop: 4 },
  btn: { borderRadius: 16, overflow: 'hidden', marginTop: 32 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  errorBox: { backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#7f1d1d', padding: 14, borderRadius: 12, marginTop: 8 },
  errorText: { color: '#f87171', fontSize: 14 },
  successBox: { backgroundColor: '#052e16', borderWidth: 1, borderColor: '#166534', padding: 14, borderRadius: 12, marginTop: 8 },
  successText: { color: '#4ade80', fontSize: 14, fontWeight: '600' },
});
