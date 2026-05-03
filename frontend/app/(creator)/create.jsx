import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';
import { C, R, GRAD_ACCENT } from '../../components/theme';

const TYPES = [
  { key: 'article',     label: 'Article', icon: '✦' },
  { key: 'video_embed', label: 'Video',   icon: '▶' },
  { key: 'image_story', label: 'Story',   icon: '◈' },
];

export default function Create() {
  const router = useRouter();
  const [type, setType]       = useState('article');
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [tags, setTags]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await apiRequest('/api/content', {
        method: 'POST',
        body: {
          title: title.trim(),
          body: body.trim(),
          content_type: type,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        },
      });
      setSuccess(true);
      setTitle(''); setBody(''); setTags('');
    } catch (e) {
      setError(e.error || e.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.heading}>New Post</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Type selector */}
          <Text style={s.label}>Content Type</Text>
          <View style={s.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.typeBtn, type === t.key && s.typeBtnActive]}
                onPress={() => setType(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.typeIcon, type === t.key && s.typeIconActive]}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.key && s.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={s.label}>Title <Text style={s.req}>*</Text></Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your post a title…"
            placeholderTextColor={C.textFaint}
            maxLength={120}
          />

          {/* Body */}
          <Text style={s.label}>Content</Text>
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
          <Text style={s.label}>Tags <Text style={s.hint}>(comma separated)</Text></Text>
          <TextInput
            style={s.input}
            value={tags}
            onChangeText={setTags}
            placeholder="football, fitness, nutrition"
            placeholderTextColor={C.textFaint}
            autoCapitalize="none"
          />

          {/* Feedback */}
          {error   ? <Text style={s.error}>{error}</Text>       : null}
          {success ? <Text style={s.successMsg}>✓ Submitted — under review.</Text> : null}

          {/* Submit */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={loading} style={{ marginTop: 28 }}>
            <LinearGradient colors={GRAD_ACCENT} style={[s.submitBtn, loading && s.submitDisabled]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.submitText}>{loading ? 'Submitting…' : 'Submit for Review'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.reviewNote}>Posts are reviewed before publishing.</Text>

        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  back:           { color: C.accent, fontSize: 15, fontWeight: '600', width: 60 },
  heading:        { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  scroll:         { padding: 20, paddingBottom: 120 },

  label:          { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  req:            { color: C.accent },
  hint:           { color: C.textFaint, fontWeight: '400', textTransform: 'none', letterSpacing: 0 },

  typeRow:        { flexDirection: 'row', gap: 10 },
  typeBtn:        { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, gap: 6 },
  typeBtnActive:  { borderColor: C.accent, backgroundColor: C.accentDark },
  typeIcon:       { fontSize: 18, color: C.textFaint },
  typeIconActive: { color: C.accent },
  typeLabel:      { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  typeLabelActive:{ color: C.accent },

  input:          { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 14, color: C.text, fontSize: 15 },
  textarea:       { minHeight: 150, paddingTop: 14 },

  error:          { color: C.error, fontSize: 13, marginTop: 10 },
  successMsg:     { color: C.success, fontSize: 14, fontWeight: '700', marginTop: 10 },

  submitBtn:      { borderRadius: R.full, paddingVertical: 17, alignItems: 'center' },
  submitDisabled: { opacity: 0.45 },
  submitText:     { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  reviewNote:     { color: C.textFaint, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
