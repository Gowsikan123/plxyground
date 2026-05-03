import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';
import Toast from '../../components/Toast';
import { C, R, GRAD_ACCENT } from '../../components/theme';

const TYPES = [
  { key: 'article',     label: 'Article', icon: '✦' },
  { key: 'video_embed', label: 'Video',   icon: '▶' },
  { key: 'image_story', label: 'Story',   icon: '◈' },
];

const SUGGESTED_TAGS = ['football', 'basketball', 'fitness', 'nutrition', 'mindset', 'athletics', 'cricket', 'swimming'];

function wordCount(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins  = Math.max(1, Math.round(words / 200));
  return { words, mins };
}

export default function Create() {
  const router = useRouter();
  const draftRef = useRef({});

  const [type, setType]       = useState('article');
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [tags, setTags]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState({ visible: false, message: '', type: 'success' });

  // Restore draft on mount
  useEffect(() => {
    const d = draftRef.current;
    if (d.title) setTitle(d.title);
    if (d.body)  setBody(d.body);
    if (d.type)  setType(d.type);
  }, []);

  // Auto-save draft on every change
  useEffect(() => { draftRef.current = { title, body, type, tags }; }, [title, body, type, tags]);

  const addTag = (tag) => {
    Haptics.selectionAsync();
    const existing = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!existing.includes(tag)) {
      setTags(existing.length ? existing.join(', ') + ', ' + tag : tag);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      draftRef.current = {};
      setTitle(''); setBody(''); setTags('');
      setToast({ visible: true, message: '✓ Submitted — under review', type: 'success' });
    } catch (e) {
      setError(e.error || e.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const wc = wordCount(body);

  return (
    <SafeAreaView style={s.safe}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.heading}>New Post</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={s.label}>Content Type</Text>
          <View style={s.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.typeBtn, type === t.key && s.typeBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setType(t.key); }}
                activeOpacity={0.8}
              >
                <Text style={[s.typeIcon, type === t.key && s.typeIconActive]}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.key && s.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.labelRow}>
            <Text style={s.label}>Title <Text style={s.req}>*</Text></Text>
            <Text style={s.counter}>{title.length} / 120</Text>
          </View>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your post a title…"
            placeholderTextColor={C.textFaint}
            maxLength={120}
          />

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
          {body.trim().length > 0 && (
            <Text style={s.wordCount}>{wc.words} words · ~{wc.mins} min read</Text>
          )}

          <Text style={s.label}>Tags <Text style={s.hint}>(comma separated)</Text></Text>
          <TextInput
            style={s.input}
            value={tags}
            onChangeText={setTags}
            placeholder="football, fitness, nutrition"
            placeholderTextColor={C.textFaint}
            autoCapitalize="none"
          />
          <View style={s.tagChips}>
            {SUGGESTED_TAGS.map(tag => {
              const active = tags.split(',').map(t => t.trim()).includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[s.tagChip, active && s.tagChipActive]}
                  onPress={() => addTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tagChipText, active && s.tagChipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

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
  labelRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  label:          { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  counter:        { color: C.textFaint, fontSize: 12 },
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
  wordCount:      { color: C.textFaint, fontSize: 12, marginTop: 6, textAlign: 'right' },
  tagChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tagChip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  tagChipActive:  { borderColor: C.accent, backgroundColor: C.accentDim },
  tagChipText:    { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  tagChipTextActive: { color: C.accent },
  error:          { color: C.error, fontSize: 13, marginTop: 10 },
  submitBtn:      { borderRadius: R.full, paddingVertical: 17, alignItems: 'center' },
  submitDisabled: { opacity: 0.45 },
  submitText:     { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  reviewNote:     { color: C.textFaint, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
