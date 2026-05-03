import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export function PostCard({ post }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/post/${post.id}`)}
      style={styles.card}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(`/creator/${post.creator_id}`)} style={styles.creatorRow}>
          <Avatar uri={post.avatar_url} name={post.display_name} size={36} />
          <View>
            <Text style={styles.name}>{post.display_name}</Text>
            <Text style={styles.meta}>@{post.username}</Text>
          </View>
        </TouchableOpacity>
        {post.is_verified ? <Badge label="Verified" color={Colors.accent} /> : null}
      </View>
      <Text style={styles.title}>{post.title}</Text>
      {post.body ? <Text style={styles.body} numberOfLines={3}>{post.body}</Text> : null}
      <View style={styles.footer}>
        {(post.tags || []).slice(0, 3).map((tag) => (
          <Badge key={tag} label={`#${tag}`} color={Colors.textMuted} />
        ))}
        <Text style={styles.views}>{post.view_count} views</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], borderWidth: 1, borderColor: Colors.border, gap: Spacing[2] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  name: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.sm, color: Colors.text },
  meta: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textMuted },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted, lineHeight: Typography.sizes.base * 1.5 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap', marginTop: Spacing[1] },
  views: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textFaint, marginLeft: 'auto' },
});
