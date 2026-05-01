import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { C, R, GRAD_HERO, GRAD_CYAN, GRAD_LIME, GRAD_PURPLE } from '../components/theme';

const TYPES = [
  { id: 'article',     label: 'Article', icon: '📝', grad: ['#00D4FF','#0099CC'] },
  { id: 'video_embed', label: 'Video',   icon: '🎥', grad: ['#BF5FFF','#8B2FCC'] },
  { id: 'image_story', label: 'Story',   icon: '📸', grad: ['#AAFF00','#7DCC00'] },
];

export default function Create() {
  const [type, setType]         = useState('article');
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required'); return; }
    setLoading(true); setError('');
    try {
      await apiRequest('/api/content', {
        method: 'POST',
        body: { title: title.trim(), body: body.trim(), content_type: type, media_url: mediaUrl.trim() || null },
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace('/feed');
    } catch (e) {
      setError(e.message || 'Failed to post. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = TYPES.find(t => t.id === type);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.blobBR} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Post</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Type selector */}
        <View style={s.typeSection}>
          <Text style={s.sectionLabel}>Content Type</Text>
          <View style={s.typeRow}>
            {TYPES.map(t => {
              const active = type === t.id;
              return (
                <TouchableOpacity key={t.id} style={[s.typeBtn, active && s.typeBtnActive]} onPress={() => setType(t.id)} activeOpacity={0.8}>
                  {active
                    ? <LinearGradient colors={t.grad} style={s.typeBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Text style={s.typeIcon}>{t.icon}</Text>
                        <Text style={s.typeBtnActiveText}>{t.label}</Text>
                      </LinearGradient>
                    : <><Text style={s.typeIcon}>{t.icon}</Text><Text style={s.typeBtnText}>{t.label}</Text></>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form */}
        <View style={s.form}>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <View style={s.field}>
            <Text style={s.label}>Title *</Text>
            <TextInput style={s.input} placeholder="Give your post a bold title…" placeholderTextColor={C.textFaint} value={title} onChangeText={setTitle} maxLength={120} />
            <Text style={s.charCount}>{title.length}/120</Text>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Body *</Text>
            <TextInput style={[s.input, s.textArea]} placeholder="Tell your story…" placeholderTextColor={C.textFaint} value={body} onChangeText={setBody} multiline numberOfLines={6} textAlignVertical="top" />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Media URL {type === 'video_embed' ? '(YouTube/Vimeo)' : '(Image)'}</Text>
            <TextInput style={s.input} placeholder="https://…" placeholderTextColor={C.textFaint} value={mediaUrl} onChangeText={setMediaUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          </View>

          <TouchableOpacity style={s.submitWrap} onPress={handleSubmit} activeOpacity={0.88} disabled={loading}>
            <LinearGradient colors={GRAD_HERO} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.submitText}>{loading ? 'Publishing…' : `Publish ${selectedType?.label} →`}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  blobBR:          { position: 'absolute', bottom: 80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(170,255,0,0.07)' },
  scroll:          { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  backText:        { color: C.textMuted, fontSize: 22, fontWeight: '300' },
  headerTitle:     { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  typeSection:     { marginBottom: 28 },
  sectionLabel:    { color: C.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  typeRow:         { flexDirection: 'row', gap: 10 },
  typeBtn:         { flex: 1, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden', paddingVertical: 14, alignItems: 'center', gap: 6, backgroundColor: C.surface },
  typeBtnActive:   { borderColor: 'transparent' },
  typeBtnGrad:     { width: '100%', paddingVertical: 14, alignItems: 'center', gap: 6 },
  typeIcon:        { fontSize: 22 },
  typeBtnText:     { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  typeBtnActiveText:{ color: '#fff', fontSize: 12, fontWeight: '800' },
  form:            { gap: 18 },
  errorBox:        { backgroundColor: C.redDark, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)', padding: 14, borderRadius: R.md },
  errorText:       { color: C.red, fontSize: 13, fontWeight: '600' },
  field:           { gap: 8 },
  label:           { color: C.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  input:           { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: 16, color: C.text, fontSize: 15 },
  textArea:        { minHeight: 140, paddingTop: 16 },
  charCount:       { color: C.textFaint, fontSize: 11, textAlign: 'right' },
  submitWrap:      { borderRadius: R.xl, overflow: 'hidden', marginTop: 8 },
  submitBtn:       { paddingVertical: 20, alignItems: 'center' },
  submitText:      { color: '#fff', fontSize: 17, fontWeight: '900' },
});
