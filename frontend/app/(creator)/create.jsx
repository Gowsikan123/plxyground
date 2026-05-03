import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, GRAD_ACCENT } from '../../components/theme';
import { Header } from '../../components/layout/Header';
import { apiRequest } from '../../components/ApiClient';
import { useToastStore } from '../../components/ui/Toast';

const CONTENT_TYPES   = ['Article', 'Video', 'Highlight', 'Opinion'];
const TAG_SUGGESTIONS = ['football', 'nutrition', 'fitness', 'mindset', 'basketball', 'recovery'];
const TITLE_MAX       = 120;

function wordCount(text) {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export default function CreatePost() {
  const router      = useRouter();
  const showToast   = useToastStore(s => s.show);
  const draftRef    = useRef(null);

  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [tags, setTags]       = useState('');
  const [type, setType]       = useState('Article');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Restore draft on mount
  useEffect(() => {
    if (draftRef.current) {
      setTitle(draftRef.current.title || '');
      setBody(draftRef.current.body   || '');
      setType(draftRef.current.type   || 'Article');
    }
  }, []);

  // Auto-save draft on every keystroke (in-memory)
  useEffect(() => {
    draftRef.current = { title, body, type };
  }, [title, body, type]);

  const appendTag = (tag) => {
    const current = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      setTags([...current, tag].join(', '));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const wc       = wordCount(body);
  const readMins = Math.max(1, Math.ceil(wc / 200));

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true); setError('');
    try {
      const tagArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      await apiRequest('/api/content', {
        method: 'POST',
        body: {
          title:        title.trim(),
          body:         body.trim(),
          content_type: 'content',
          tags:         tagArr,
          media_type:   type.toLowerCase(),
        },
      });
      draftRef.current = null;
      showToast('Post submitted for review!', 'success');
      router.back();
    } catch (e) {
      setError(e.message || 'Failed to post. Try again.');
      showToast('Failed to post. Try again.', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <Header title="New Post" showBack />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {/* Content type chips */}
        <Text style={s.label}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeRow}>
          {CONTENT_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.typeChip, type === t && s.typeChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType(t); }}
            >
              <Text style={[s.typeText, type === t && s.typeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Title + character counter */}
        <View style={s.labelRow}>
          <Text style={s.label}>Title</Text>
          <Text style={[s.counter, title.length >= TITLE_MAX && s.counterRed]}>
            {title.length} / {TITLE_MAX}
          </Text>
        </View>
        <TextInput
          style={s.titleInput}
          placeholder="Post title…"
          placeholderTextColor={C.textFaint}
          value={title}
          onChangeText={t => setTitle(t.slice(0, TITLE_MAX))}
          maxLength={TITLE_MAX}
          multiline
        />

        {/* Body + word count */}
        <Text style={s.label}>Body</Text>
        <TextInput
          style={s.bodyInput}
          placeholder="Write your post…"
          placeholderTextColor={C.textFaint}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />
        {wc > 0 && (
          <Text style={s.wordCount}>{wc} words · ~{readMins} min read</Text>
        )}

        {/* Tags + autocomplete chips */}
        <Text style={s.label}>Tags</Text>
        <TextInput
          style={s.tagInput}
          placeholder="football, fitness, nutrition…"
          placeholderTextColor={C.textFaint}
          value={tags}
          onChangeText={setTags}
          autoCapitalize="none"
        />
        <View style={s.tagSuggestions}>
          {TAG_SUGGESTIONS.map(tag => (
            <TouchableOpacity key={tag} style={s.tagSugChip} onPress={() => appendTag(tag)}>
              <Text style={s.tagSugText}>+ {tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.submitWrap} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={GRAD_ACCENT} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.submitText}>{loading ? 'Posting…' : 'Publish Post →'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:           { flex: 1, backgroundColor: C.bg },
  content:        { padding: 20, gap: 10, paddingBottom: 48 },
  errorBox:       { backgroundColor: C.errorDark, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 14, borderRadius: R.md },
  errorText:      { color: C.error, fontSize: 13, fontWeight: '600' },
  labelRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:          { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 },
  counter:        { color: C.textFaint, fontSize: 12, fontWeight: '600' },
  counterRed:     { color: C.error },
  typeRow:        { gap: 8, marginBottom: 4 },
  typeChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  typeChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  typeText:       { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  titleInput:     { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, color: C.text, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: C.border, minHeight: 56 },
  bodyInput:      { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border, minHeight: 200, lineHeight: 22 },
  wordCount:      { color: C.textFaint, fontSize: 12, marginTop: -4 },
  tagInput:       { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  tagSuggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  tagSugChip:     { backgroundColor: C.surface3, borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  tagSugText:     { color: C.accent, fontSize: 12, fontWeight: '700' },
  submitWrap:     { borderRadius: R.xl, overflow: 'hidden', marginTop: 16 },
  submitBtn:      { paddingVertical: 20, alignItems: 'center' },
  submitText:     { color: '#fff', fontSize: 17, fontWeight: '900' },
});
