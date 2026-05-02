import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export const PostCard = memo(function PostCard({ post }) {
  const router = useRouter();

  const handlePress = () => router.push(`/post/${post.id}`);
  const handleCreatorPress = () => router.push(`/creator/${post.creator?.id}`);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      {post.mediaurl && post.mediatype === 'image' && (
        <Image
          source={{ uri: post.mediaurl }}
          style={styles.media}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <TouchableOpacity style={styles.creatorRow} onPress={handleCreatorPress}>
          <Avatar uri={post.creator?.avatarurl} name={post.creator?.displayname} size={34} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{post.creator?.displayname}</Text>
            <Text style={styles.creatorUsername}>@{post.creator?.username}</Text>
          </View>
          {post.creator?.sport && (
            <Badge label={post.creator.sport} variant="default" />
          )}
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        {post.body && (
          <Text style={styles.body_text} numberOfLines={3}>{post.body}</Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.stat}>👁 {post.viewcount ?? 0}</Text>
          <Text style={styles.stat}>❤️ {post.likecount ?? 0}</Text>
          <Text style={styles.date}>
            {new Date(post.createdat).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceElevated,
  },
  body: { padding: spacing[4] },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  creatorInfo: { flex: 1 },
  creatorName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  creatorUsername: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    marginBottom: spacing[1] + 2,
    lineHeight: fontSize.md * 1.35,
  },
  body_text: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
    marginBottom: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[2],
  },
  stat: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  date: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginLeft: 'auto',
  },
});
