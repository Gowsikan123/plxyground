import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';
import { C, R, GRAD_HERO } from '../../components/theme';

const TYPES = [
  { key: 'article',     label: 'Article',  icon: '📝' },
  { key: 'video_embed', label: 'Video',    icon: '🎬' },
  { key: 'image_story', label: 'Story',    icon: '🖼️' },
];

export default function Create() {
  const router = useRouter();
  const [type, setType]     = useState('article');
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [tags, setTags]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await apiRequest('/api/content', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          content_type: type,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      setSuccess(true);
      setTitle(''); setBody(''); setTags('');
    } catch (e) {
      setError(e.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={s.heading}>Create Post</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Type selector */}
          <Text style={s.fieldLabel}>Content Type</Text>
          <View style={s.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.typeBtn, type === t.key && s.typeBtnActive]}
                onPress={() => setType(t.key)}
                activeOpacity={0.8}
              >
                <Text style={s.typeIcon}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.key && s.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={s.fieldLabel}>Title <Text style={s.req}>*</Text></Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your post a great title…"
            placeholderTextColor={C.textFaint}
            maxLength={120}
          />

          {/* Body */}
          <Text style={s.fieldLabel}>Content</Text>
          <TextInput
            style={[s.input, s.textarea]}
            value={body}
            onChangeText={setBody}
            placeholder="What do you want to share?"
            placeholderTextColor={C.textFaint}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          {/* Tags */}
          <Text style={s.fieldLabel}>Tags <Text style={s.hint}>(comma separated)</Text></Text>
          <TextInput
            style={s.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. football, fitness, nutrition"
            placeholderTextColor={C.textFaint}
            autoCapitalize="none"
          />

          {error ? <Text style={s.error}>{error}</Text> : null}
          {success ? <Text style={s.successMsg}>✓ Post submitted for review!</Text> : null}

          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={GRAD_HERO} style={[s.submitBtn, loading && s.submitDisabled]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.submitText}>{loading ? 'Submitting…' : 'Submit for Review'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.reviewNote}>Posts are reviewed by our team before publishing.</Text>

        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  back:           { color: C.accent, fontSize: 16, fontWeight: '600', width: 60 },
  heading:        { color: C.text, fontSize: 17, fontWeight: '800' },
  scroll:         { padding: 20, gap: 6, paddingBottom: 120 },
  fieldLabel:     { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  req:            { color: C.accent },
  hint:           { color: C.textFaint, fontWeight: '400', textTransform: 'none' },
  typeRow:        { flexDirection: 'row', gap: 10 },
  typeBtn:        { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, gap: 4 },
  typeBtnActive:  { borderColor: C.accent, backgroundColor: C.accentDim },
  typeIcon:       { fontSize: 20 },
  typeLabel:      { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  typeLabelActive:{ color: C.accent },
  input:          { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 13, color: C.text, fontSize: 15 },
  textarea:       { minHeight: 140, paddingTop: 13 },
  error:          { color: C.error, fontSize: 13, marginTop: 8 },
  successMsg:     { color: C.success, fontSize: 14, fontWeight: '700', marginTop: 8 },
  submitBtn:      { marginTop: 24, borderRadius: R.full, paddingVertical: 16, alignItems: 'center' },
  submitDisabled: { opacity: 0.5 },
  submitText:     { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  reviewNote:     { color: C.textFaint, fontSize: 12, textAlign: 'center', marginTop: 12 },
});
