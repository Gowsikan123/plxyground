import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { contentService } from '../../services/contentService';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await contentService.getById(id);
      if (err) { setError(err); setLoading(false); return; }
      setPost(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      {post.media_url ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.body}>
        <View style={styles.authorRow}>
          {post.creator?.avatar_url ? (
            <Image source={{ uri: post.creator.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {post.creator?.display_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{post.creator?.display_name}</Text>
            <Text style={styles.authorHandle}>@{post.creator?.username}</Text>
          </View>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        {post.body ? <Text style={styles.content}>{post.body}</Text> : null}

        <View style={styles.meta}>
          {post.sport ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{post.sport}</Text>
            </View>
          ) : null}
          {post.content_type ? (
            <View style={[styles.tag, styles.tagSecondary]}>
              <Text style={styles.tagText}>{post.content_type}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.timestamp}>
          {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.xs },
  backLabel: { color: COLORS.text, ...TYPOGRAPHY.body },
  media: { width: '100%', height: 280 },
  body: { padding: SPACING.lg },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  authorName: { ...TYPOGRAPHY.label, color: COLORS.text },
  authorHandle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.sm },
  content: { ...TYPOGRAPHY.body, color: COLORS.textMuted, lineHeight: 24, marginBottom: SPACING.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  tag: {
    backgroundColor: COLORS.primaryLight, borderRadius: 12,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  tagSecondary: { backgroundColor: COLORS.surface },
  tagText: { ...TYPOGRAPHY.caption, color: COLORS.primary },
  timestamp: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.error, marginVertical: SPACING.md },
  backBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: 8 },
  backBtnText: { color: '#fff', ...TYPOGRAPHY.label },
});
