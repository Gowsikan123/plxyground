import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const { width: SCREEN_W } = Dimensions.get('window');

export default function PostCard({ post, onLike }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);

  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    onLike?.(post.id, next);
  }

  if (!post) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => router.push(`/post/${post.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`View post: ${post.title}`}
    >
      {post.media_url ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.thumbnail}
          resizeMode="cover"
          accessibilityLabel={post.title}
        />
      ) : null}

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push(`/creator/${post.creator_slug}`)}
            activeOpacity={0.8}
          >
            <Avatar uri={post.creator_avatar} initials={post.creator_name?.[0] ?? 'C'} size={28} />
            <Text style={styles.authorName}>{post.creator_name}</Text>
          </TouchableOpacity>
          {post.content_type ? (
            <Badge label={post.content_type} variant="outline" />
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {post.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {post.description}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? COLORS.error : COLORS.textMuted}
            />
            <Text style={styles.actionCount}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/post/${post.id}#comments`)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.actionCount}>{post.comments ?? 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    width: '100%',
    height: SCREEN_W * 0.5,
    backgroundColor: COLORS.surfaceOffset,
  },
  body: {
    padding: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  authorName: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.textMuted,
  },
  title: {
    ...TYPOGRAPHY.bodyMd,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
    minHeight: 44,
  },
  actionCount: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.textMuted,
  },
});
