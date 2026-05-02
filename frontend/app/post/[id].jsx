import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import SafeScreen from '../../components/layout/SafeScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import contentService from '../../services/contentService';

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await contentService.getById(id);
        if (err) throw new Error(err);
        setPost(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <SafeScreen>
        <ScreenHeader title="Post" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeScreen>
    );
  }

  if (error || !post) {
    return (
      <SafeScreen>
        <ScreenHeader title="Post" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Post not found'}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScreenHeader title="Post" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.authorRow}>
          <TouchableOpacity
            style={styles.authorLeft}
            onPress={() => router.push(`/creator/${post.creator_slug}`)}
          >
            <Avatar uri={post.creator_avatar} name={post.creator_display_name} size={40} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.creator_display_name}</Text>
              <Text style={styles.authorHandle}>@{post.creator_username}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {post.media_url ? (
          <Image
            source={{ uri: post.media_url }}
            style={styles.media}
            resizeMode="cover"
            accessibilityLabel={post.title}
          />
        ) : null}

        <View style={styles.body}>
          <Text style={styles.title}>{post.title}</Text>
          {post.description ? (
            <Text style={styles.description}>{post.description}</Text>
          ) : null}
          <Text style={styles.meta}>
            {post.sport} · {new Date(post.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.error, fontFamily: TYPOGRAPHY.fonts.body, fontSize: TYPOGRAPHY.sizes.base },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  authorInfo: { flexDirection: 'column' },
  authorName: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  authorHandle: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
  },
  media: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: SPACING.md, gap: SPACING.sm },
  title: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 26,
  },
  description: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  meta: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textFaint,
    marginTop: SPACING.xs,
  },
});
