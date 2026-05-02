import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Input from '../../components/ui/Input';
import { contentService } from '../../services/contentService';
import { useAuth } from '../../hooks/useAuth';

const CONTENT_TYPES = ['video', 'image', 'article', 'highlight'];
const SPORT_TAGS = ['basketball', 'football', 'cricket', 'tennis', 'mma', 'fitness', 'athletics', 'swimming', 'rugby', 'boxing'];

export default function CreateScreen() {
  const { token } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', content_type: 'video', media_url: '', sport_tags: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      sport_tags: f.sport_tags.includes(tag) ? f.sport_tags.filter((t) => t !== tag) : [...f.sport_tags, tag],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim() || !form.description.trim()) { setError('Title and description are required'); return; }
    setLoading(true);
    const { error: err } = await contentService.create({ ...form, sport_tags: form.sport_tags.join(',') }, token);
    setLoading(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); router.push('/(creator)/feed'); }, 1500);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>New Post</Text>
        <Text style={styles.sub}>Share your sports content with the community</Text>

        <View style={styles.form}>
          <Input label="Title *" value={form.title} onChangeText={set('title')} placeholder="What's this about?" />
          <Input label="Description *" value={form.description} onChangeText={set('description')} multiline numberOfLines={4} placeholder="Tell your story..." />
          <Input label="Media URL" value={form.media_url} onChangeText={set('media_url')} keyboardType="url" autoCapitalize="none" placeholder="https://..." />

          <Text style={styles.sectionLabel}>Content Type</Text>
          <View style={styles.chipRow}>
            {CONTENT_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[styles.chip, form.content_type === type && styles.chipActive]}
                onPress={() => set('content_type')(type)}
              >
                <Text style={[styles.chipText, form.content_type === type && styles.chipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Sport Tags</Text>
          <View style={styles.chipRow}>
            {SPORT_TAGS.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.chip, form.sport_tags.includes(tag) && styles.chipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.chipText, form.sport_tags.includes(tag) && styles.chipTextActive]}>#{tag}</Text>
              </Pressable>
            ))}
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>✓ Post published!</Text>}

          <Pressable style={({ pressed }) => [styles.btnSubmit, pressed && { opacity: 0.8 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Publish Post</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, padding: SPACING[6], paddingTop: SPACING[14] },
  heading: { ...TYPOGRAPHY.displaySm, color: COLORS.text, marginBottom: SPACING[1] },
  sub: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, marginBottom: SPACING[6] },
  form: { gap: SPACING[4] },
  sectionLabel: { ...TYPOGRAPHY.labelMd, color: COLORS.textMuted, marginTop: SPACING[2] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  chip: { paddingHorizontal: SPACING[3], paddingVertical: SPACING[2], borderRadius: SPACING[5], borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { ...TYPOGRAPHY.labelSm, color: COLORS.textMuted },
  chipTextActive: { color: '#fff' },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error },
  successText: { ...TYPOGRAPHY.bodySm, color: COLORS.success },
  btnSubmit: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: SPACING[4], alignItems: 'center', marginTop: SPACING[4] },
  btnText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
});
