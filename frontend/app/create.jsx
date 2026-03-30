import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar, SafeAreaView, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

const TYPES = [
  { key: 'article', label: '📝 Article', desc: 'Long-form content' },
  { key: 'video_embed', label: '🎥 Video', desc: 'Video content' },
  { key: 'image_story', label: '📸 Story', desc: 'Photo story' },
];

const SAMPLE_URLS = [
  'https://images.unsplash.com/photo-1546519638405-a9f5a95a5b64?w=800',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
];

export default function Create() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [contentType, setContentType] = useState('article');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  const handleCreate = async () => {
    setError(''); setSuccess('');
    if (!title) { setError('Title is required'); return; }
    if (!body) { setError('Body content is required'); return; }
    if (!mediaUrl) { setError('Media URL is required — add an image link'); return; }
    setLoading(true);
    try {
      await apiRequest('/api/content', 'POST', { title, body, content_type: contentType, media_url: mediaUrl }, token);
      setSuccess('🎉 Post submitted for review!');
      setTimeout(() => router.replace('/feed'), 1800);
    } catch (err) {
      setError(err.error || 'Failed to create post');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Post</Text>
            <View style={{ width: 40 }} />
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorIcon}>⚠</Text><Text style={styles.errorText}>{error}</Text></View> : null}
          {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

          <Text style={styles.sectionTitle}>Post Type</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeCard, contentType === t.key && styles.typeCardActive]}
                onPress={() => setContentType(t.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.typeEmoji}>{t.label.split(' ')[0]}</Text>
                <Text style={[styles.typeLabel, contentType === t.key && styles.typeLabelActive]}>{t.label.split(' ').slice(1).join(' ')}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Give your post a compelling title"
            placeholderTextColor="#334155"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.sectionTitle}>Media URL <Text style={styles.required}>* required</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#334155"
            value={mediaUrl}
            onChangeText={setMediaUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Tap a sample image below to use it:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sampleRow}>
            {SAMPLE_URLS.map((url, i) => (
              <TouchableOpacity key={i} onPress={() => setMediaUrl(url)} style={[styles.sampleThumb, mediaUrl === url && styles.sampleThumbActive]}>
                <Image source={{ uri: url }} style={styles.sampleImg} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {mediaUrl ? <Image source={{ uri: mediaUrl }} style={styles.preview} /> : null}

          <Text style={styles.sectionTitle}>Body</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Share your story, insights, or experience..."
            placeholderTextColor="#334155"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Post →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>Your post will be reviewed by our team before going live.</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  inner: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  backText: { color: '#3b82f6', fontSize: 18 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, marginTop: 24 },
  required: { color: '#f87171', fontWeight: '400' },
  hint: { color: '#334155', fontSize: 12, marginTop: 6, marginBottom: 10 },
  input: { backgroundColor: '#0f1623', color: '#fff', padding: 16, borderRadius: 14, fontSize: 15, borderWidth: 1, borderColor: '#1e293b' },
  textarea: { height: 160, textAlignVertical: 'top', lineHeight: 22 },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, backgroundColor: '#0f1623', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#1e293b', gap: 4 },
  typeCardActive: { borderColor: '#3b82f6', backgroundColor: '#0d1e38' },
  typeEmoji: { fontSize: 22 },
  typeLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  typeLabelActive: { color: '#60a5fa' },
  typeDesc: { color: '#334155', fontSize: 10 },
  sampleRow: { marginBottom: 12 },
  sampleThumb: { width: 80, height: 60, borderRadius: 10, marginRight: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  sampleThumbActive: { borderColor: '#3b82f6' },
  sampleImg: { width: '100%', height: '100%' },
  preview: { width: '100%', height: 180, borderRadius: 14, marginBottom: 8, marginTop: 4 },
  btn: { borderRadius: 16, overflow: 'hidden', marginTop: 28, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#7f1d1d', padding: 14, borderRadius: 12, marginBottom: 8, marginTop: 8, gap: 10 },
  errorIcon: { fontSize: 16 },
  errorText: { color: '#f87171', fontSize: 14, flex: 1 },
  successBox: { backgroundColor: '#052e16', borderWidth: 1, borderColor: '#166534', padding: 14, borderRadius: 12, marginBottom: 8, marginTop: 8 },
  successText: { color: '#4ade80', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  disclaimer: { color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 16 },
});