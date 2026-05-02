import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PostCard = React.memo(({ post }) => {
  const router = useRouter();
  const creator = post.creator || {};

  return (
    <Card onPress={() => router.push(`/post/${post.id}`)} style={styles.card}>
      <View style={styles.creatorRow}>
        <Avatar uri={creator.avatar_url} name={creator.display_name || creator.username} size="sm" />
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName} numberOfLines={1}>
            {creator.display_name || creator.username}
          </Text>
          {creator.sport ? (
            <Badge label={creator.sport} variant="info" size="xs" />
          ) : null}
        </View>
        <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      {post.body ? (
        <Text style={styles.body} numberOfLines={3}>{post.body}</Text>
      ) : null}

      {post.media_url && post.media_type !== 'none' ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.stat}>👁 {post.view_count ?? 0}</Text>
        <Text style={styles.stat}>❤️ {post.like_count ?? 0}</Text>
        <View style={styles.tags}>
          {(post.tags || []).slice(0, 2).map((tag, i) => (
            <Badge key={i} label={`#${tag}`} variant="default" size="xs" style={styles.tagChip} />
          ))}
        </View>
      </View>
    </Card>
  );
});

PostCard.displayName = 'PostCard';
export default PostCard;

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  creatorInfo: { flex: 1, gap: 2 },
  creatorName: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.sm, color: colors.textPrimary },
  time: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes.lg, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { fontFamily: fontFamilies.body, fontSize: fontSizes.md, color: colors.textSecondary, lineHeight: fontSizes.md * 1.5, marginBottom: spacing.sm },
  media: { width: '100%', aspectRatio: 16 / 9, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  stat: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted },
  tags: { flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'flex-end' },
  tagChip: { marginLeft: 0 },
});
