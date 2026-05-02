import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export const PostCard = React.memo(({ post }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(`/post/${post.id}`);
  }, [post.id]);

  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 2) : [];

  return (
    <Card onPress={handlePress} style={styles.card}>
      {/* Creator row */}
      <View style={styles.header}>
        <Avatar
          uri={post.avatar_url}
          name={post.display_name}
          size={38}
        />
        <View style={styles.headerText}>
          <Text style={styles.displayName} numberOfLines={1}>{post.display_name}</Text>
          <View style={styles.metaRow}>
            {post.sport && <Badge label={post.sport} variant="primary" style={styles.sportBadge} />}
            <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      {post.title ? (
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
      ) : null}

      {/* Body preview */}
      {post.body ? (
        <Text style={styles.body} numberOfLines={3}>{post.body}</Text>
      ) : null}

      {/* Media thumbnail */}
      {post.media_url && post.media_type !== 'none' ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.media}
          resizeMode="cover"
          accessibilityLabel={`Media for ${post.title}`}
        />
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.stat}>👁 {post.view_count ?? 0}</Text>
        <Text style={styles.stat}>❤️ {post.like_count ?? 0}</Text>
        <View style={styles.tags}>
          {tags.map(tag => (
            <Badge key={tag} label={tag} style={styles.tag} />
          ))}
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card:        { marginBottom: spacing.sm },
  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  headerText:  { flex: 1 },
  displayName: { ...typography.bodyMd, color: colors.textPrimary },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  sportBadge:  { },
  time:        { ...typography.caption },
  title:       { ...typography.h3, fontSize: 16, marginBottom: spacing.xs },
  body:        { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  media: {
    width: '100%', height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  footer:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stat:        { ...typography.caption, color: colors.textSecondary },
  tags:        { flexDirection: 'row', gap: spacing.xs, flex: 1, justifyContent: 'flex-end' },
  tag:         { },
});
