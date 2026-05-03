import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, GRAD_ACCENT } from '../../components/theme';
import { apiRequest } from '../../components/ApiClient';
import { useToastStore } from '../../components/ui/Toast';

let Haptics;
if (Platform.OS !== 'web') {
  try { Haptics = require('expo-haptics'); } catch (_) { Haptics = null; }
}
const safeImpact = (style) => Haptics?.impactAsync?.(style);
const safeNotif  = (type)  => Haptics?.notificationAsync?.(type);
const ImpactStyle = { Light: 'Light', Medium: 'Medium' };
const NotifType   = { Error: 'Error' };

const CONTENT_TYPES   = ['Article', 'Video', 'Highlight', 'Opinion'];
const TYPE_ICONS      = { Article: '📝', Video: '🎬', Highlight: '⚡', Opinion: '💬' };
const TAG_SUGGESTIONS = ['football', 'nutrition', 'fitness', 'mindset', 'basketball', 'recovery', 'cricket', 'rugby'];
const TITLE_MAX       = 120;

function wordCount(text) {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export default function CreatePost() {
  const router    = useRouter();
  const showToast = useToastStore(s => s.show);
  const draftRef  = useRef(null);

  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [tags, setTags]     = useState('');
  const [type, setType]     = useState('Article');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [focused, setFocused] = useState(null); // 'title' | 'body' | 'tags' | null

  const submitScale = useRef(new Animated.Value(1)).current;
  const onSubmitIn  = () => Animated.spring(submitScale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const onSubmitOut = () => Animated.spring(submitScale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  useEffect(() => {
    if (draftRef.current) {
      setTitle(draftRef.current.title || '');
      setBody(draftRef.current.body   || '');
      setType(draftRef.current.type   || 'Article');
    }
  }, []);

  useEffect(() => {
    draftRef.current = { title, body, type };
  }, [title, body, type]);

  const appendTag = (tag) => {
    const current = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      setTags([...current, tag].join(', '));
      safeImpact(ImpactStyle.Light);
    }
  };

  const removeTag = (tag) => {
    const current = tags.split(',').map(t => t.trim()).filter(t => t && t !== tag);
    setTags(current.join(', '));
  };

  const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
  const wc         = wordCount(body);
  const readMins   = Math.max(1, Math.ceil(wc / 200));
  const canSubmit  = title.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) { setError('Title and body are required.'); return; }
    safeImpact(ImpactStyle.Medium);
    setLoading(true); setError('');
    try {
      const tagArr = parsedTags.map(t => t.toLowerCase());
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
      showToast('Post submitted for review! 🎉', 'success');
      router.back();
    } catch (e) {
      setError(e.message || 'Failed to post. Try again.');
      showToast('Failed to post. Try again.', 'error');
      safeNotif(NotifType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.sectionAccentBar} />
          <Text style={s.headerTitle}>NEW POST</Text>
        </View>
        {/* Draft indicator */}
        {(title || body) ? (
          <View style={s.draftBadge}>
            <Text style={s.draftText}>DRAFT</Text>
          </View>
        ) : <View style={{ width: 60 }} />}
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Error ── */}
        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* ── Content type ── */}
        <Text style={s.fieldLabel}>CONTENT TYPE</Text>
        <View style={s.typeGrid}>
          {CONTENT_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.typeCard, type === t && s.typeCardActive]}
              onPress={() => { safeImpact(ImpactStyle.Light); setType(t); }}
              activeOpacity={0.8}
            >
              <Text style={s.typeIcon}>{TYPE_ICONS[t]}</Text>
              <Text style={[s.typeText, type === t && s.typeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Title ── */}
        <View style={s.labelRow}>
          <Text style={s.fieldLabel}>TITLE</Text>
          <Text style={[s.counter, title.length >= TITLE_MAX * 0.9 && s.counterWarn, title.length >= TITLE_MAX && s.counterRed]}>
            {title.length} / {TITLE_MAX}
          </Text>
        </View>
        <TextInput
          style={[s.titleInput, focused === 'title' && s.inputFocused]}
          placeholder="Give your post a strong headline…"
          placeholderTextColor={C.textFaint}
          value={title}
          onChangeText={t => setTitle(t.slice(0, TITLE_MAX))}
          maxLength={TITLE_MAX}
          multiline
          onFocus={() => setFocused('title')}
          onBlur={() => setFocused(null)}
        />

        {/* ── Body ── */}
        <View style={s.labelRow}>
          <Text style={s.fieldLabel}>BODY</Text>
          {wc > 0 && (
            <Text style={s.wordCount}>{wc} words · ~{readMins} min read</Text>
          )}
        </View>
        <TextInput
          style={[s.bodyInput, focused === 'body' && s.inputFocused]}
          placeholder="Share your knowledge, story or take…"
          placeholderTextColor={C.textFaint}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocused('body')}
          onBlur={() => setFocused(null)}
        />

        {/* ── Tags ── */}
        <Text style={s.fieldLabel}>TAGS</Text>
        <TextInput
          style={[s.tagInput, focused === 'tags' && s.inputFocused]}
          placeholder="Type tags separated by commas…"
          placeholderTextColor={C.textFaint}
          value={tags}
          onChangeText={setTags}
          autoCapitalize="none"
          onFocus={() => setFocused('tags')}
          onBlur={() => setFocused(null)}
        />

        {/* Active tags as removable chips */}
        {parsedTags.length > 0 && (
          <View style={s.activeTagsRow}>
            {parsedTags.map(tag => (
              <TouchableOpacity key={tag} style={s.activeTagChip} onPress={() => removeTag(tag)}>
                <Text style={s.activeTagText}>#{tag}</Text>
                <Text style={s.activeTagRemove}> ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick-add suggestions */}
        <Text style={s.suggestLabel}>Quick add</Text>
        <View style={s.tagSuggestions}>
          {TAG_SUGGESTIONS.filter(t => !parsedTags.includes(t)).map(tag => (
            <TouchableOpacity key={tag} style={s.tagSugChip} onPress={() => appendTag(tag)}>
              <Text style={s.tagSugText}>+ {tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Divider ── */}
        <View style={s.divider} />

        {/* ── Submit ── */}
        <Animated.View style={[s.submitWrap, { transform: [{ scale: submitScale }] }]}>
          <TouchableOpacity
            onPress={handleSubmit}
            onPressIn={onSubmitIn}
            onPressOut={onSubmitOut}
            disabled={loading || !canSubmit}
            activeOpacity={1}
            style={[!canSubmit && s.submitDisabled]}
          >
            <LinearGradient
              colors={canSubmit ? GRAD_ACCENT : ['#333', '#333']}
              style={s.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.submitText}>
                {loading ? 'Posting…' : `Publish ${TYPE_ICONS[type]} ${type} →`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Review note ── */}
        <Text style={s.reviewNote}>Posts are reviewed before going live · Usually under 24h</Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:             { flex: 1, backgroundColor: C.bg },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:          { width: 60 },
  backText:         { color: C.accent, fontSize: 16, fontWeight: '700' },
  headerCenter:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccentBar: { width: 3, height: 16, backgroundColor: C.accent, borderRadius: 2 },
  headerTitle:      { color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  draftBadge:       { width: 60, alignItems: 'flex-end' },
  draftText:        { color: C.warning, fontSize: 10, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.warningDark, borderRadius: R.full, overflow: 'hidden' },

  // Scroll content
  content:          { padding: 18, gap: 12, paddingBottom: 40 },

  // Error
  errorBox:         { backgroundColor: C.errorDark, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 14, borderRadius: R.md },
  errorText:        { color: C.error, fontSize: 13, fontWeight: '600' },

  // Labels
  fieldLabel:       { color: C.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: -4 },
  labelRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter:          { color: C.textFaint, fontSize: 11, fontWeight: '600' },
  counterWarn:      { color: C.warning },
  counterRed:       { color: C.error },
  wordCount:        { color: C.accent, fontSize: 11, fontWeight: '700' },

  // Type grid (2x2)
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeCard:         { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: C.border },
  typeCardActive:   { backgroundColor: C.accentDim, borderColor: 'rgba(255,107,0,0.35)' },
  typeIcon:         { fontSize: 18 },
  typeText:         { color: C.textMuted, fontSize: 14, fontWeight: '700' },
  typeTextActive:   { color: C.accent },

  // Inputs
  titleInput:       { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, color: C.text, fontSize: 17, fontWeight: '800', borderWidth: 1, borderColor: C.border, minHeight: 60, lineHeight: 24 },
  bodyInput:        { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border, minHeight: 200, lineHeight: 23 },
  tagInput:         { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  inputFocused:     { borderColor: C.accent, borderWidth: 1.5 },

  // Active tags
  activeTagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activeTagChip:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentDim, borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,107,0,0.25)' },
  activeTagText:    { color: C.accent, fontSize: 12, fontWeight: '700' },
  activeTagRemove:  { color: C.accent, fontSize: 11, fontWeight: '900', opacity: 0.7 },

  // Tag suggestions
  suggestLabel:     { color: C.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: -4 },
  tagSuggestions:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagSugChip:       { backgroundColor: C.surface2, borderRadius: R.full, paddingHorizontal: 13, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  tagSugText:       { color: C.textMuted, fontSize: 12, fontWeight: '700' },

  // Divider + submit
  divider:          { height: 1, backgroundColor: C.border, marginVertical: 4 },
  submitWrap:       { borderRadius: R.xl, overflow: 'hidden' },
  submitDisabled:   { opacity: 0.5 },
  submitBtn:        { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  submitText:       { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  reviewNote:       { color: C.textFaint, fontSize: 11, textAlign: 'center', marginTop: 4 },
});
