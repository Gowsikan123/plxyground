import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors }      from '../../constants/colors';
import { fontSize }    from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Avatar }  from '../ui/Avatar';
import { Badge }   from '../ui/Badge';
import { Card }    from '../ui/Card';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const PostCard = React.memo(function PostCard({ post }) {
  const router = useRouter();

  const onPress = useCallback(() => {
    router.push(`/post/${post.id}`);
  }, [post.id]);

  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 2) : [];

  return (
    <Card onPress={onPress} style={styles.card}>
      {/* Creator row */}
      <View style={styles.header}>
        <Avatar uri={post.avatar_url} name={post.display_name} size="sm" />
        <View style={styles.headerText}>
          <Text style={styles.creatorName} numberOfLines={1}>{post.display_name || 'Creator'}</Text>
          <Text style={styles.meta}>{post.sport ? `${post.sport} · ` : ''}{timeAgo(post.created_at)}</Text>
        </View>
        {post.sport && <Badge label={post.sport} variant="default" />}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      {/* Body preview */}
      {!!post.body && (
        <Text style={styles.body} numberOfLines={3}>{post.body}</Text>
      )}

      {/* Media thumbnail */}
      {!!post.media_url && (
        <Image
          source={{ uri: post.media_url }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {tags.map((tag, i) => (
            <Badge key={i} label={`#${tag}`} variant="default" style={styles.tag} />
          ))}
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.statText}>👁 {post.view_count ?? 0}</Text>
          <Text style={styles.statText}>❤️ {post.like_count ?? 0}</Text>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card:        { marginHorizontal: spacing[4], marginBottom: spacing[3] },
  header:      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3], gap: spacing[2] },
  headerText:  { flex: 1 },
  creatorName: { color: colors.textPrimary, fontSize: fontSize.sm, fontFamily: 'Syne_700Bold' },
  meta:        { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  title:       { color: colors.textPrimary, fontSize: fontSize.md, fontFamily: 'Syne_700Bold', marginBottom: spacing[2], lineHeight: 24 },
  body:        { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: 'DMSans_400Regular', lineHeight: 20, marginBottom: spacing[3] },
  media:       { width: '100%', aspectRatio: 16 / 9, borderRadius: borderRadius.lg, marginBottom: spacing[3], backgroundColor: colors.surfaceElevated },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[1] },
  footerLeft:  { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap', flex: 1 },
  footerRight: { flexDirection: 'row', gap: spacing[3] },
  tag:         {},
  statText:    { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: 'DMSans_400Regular' },
});
