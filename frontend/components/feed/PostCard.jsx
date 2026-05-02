import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const PostCard = memo(function PostCard({ post }) {
  const router = useRouter();
  const tags   = Array.isArray(post.tags) ? post.tags.slice(0, 2) : [];

  return (
    <Card
      onPress={() => router.push(`/post/${post.id}`)}
      style={styles.card}
    >
      {/* Creator row */}
      <View style={styles.creatorRow}>
        <Avatar uri={post.avatar_url} name={post.display_name} size="sm" />
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName} numberOfLines={1}>{post.display_name || 'Unknown'}</Text>
          <Text style={styles.meta}>{post.sport || ''} · {timeAgo(post.created_at)}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      {/* Body preview */}
      {post.body && (
        <Text style={styles.body} numberOfLines={3}>{post.body}</Text>
      )}

      {/* Media thumbnail */}
      {post.media_url && (
        <Image
          source={{ uri: post.media_url }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          <Text style={styles.statText}>👁 {post.view_count ?? 0}</Text>
          <Text style={styles.statText}>❤️ {post.like_count ?? 0}</Text>
        </View>
        <View style={styles.tags}>
          {tags.map(tag => (
            <Badge key={tag} label={tag} variant="default" />
          ))}
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card:        { marginBottom: spacing[3] },
  creatorRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  creatorInfo: { flex: 1 },
  creatorName: { color: colors.textPrimary, fontSize: fontSize.sm, fontFamily: fontFamily.syne.bold, fontWeight: '700' },
  meta:        { color: colors.textMuted,  fontSize: fontSize.xs, fontFamily: fontFamily.dmSans.regular, marginTop: 1 },
  title:       { color: colors.textPrimary, fontSize: fontSize.md, fontFamily: fontFamily.syne.bold, fontWeight: '700', marginBottom: spacing[2], lineHeight: 24 },
  body:        { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.dmSans.regular, lineHeight: 20, marginBottom: spacing[3] },
  media:       { width: '100%', height: 180, borderRadius: radius.md, marginBottom: spacing[3] },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[1] },
  stats:       { flexDirection: 'row', gap: spacing[3] },
  statText:    { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: fontFamily.dmSans.regular },
  tags:        { flexDirection: 'row', gap: spacing[1] },
});
