import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPost } from '../../services/contentService';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await getPost(id);
      if (err) setError(err);
      else setPost(data.data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <View style={styles.page}>
      <Header title="Post" showBack />
      <SkeletonCard />
    </View>
  );

  if (error || !post) return (
    <View style={styles.page}>
      <Header title="Post" showBack />
      <EmptyState title="Post not found" message={error || 'This post may have been removed.'} />
    </View>
  );

  return (
    <View style={styles.page}>
      <Header title="Post" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.creatorRow}>
          <Avatar uri={post.avatar_url} name={post.display_name} size={44} />
          <View>
            <Text style={styles.creatorName}>{post.display_name}</Text>
            <Text style={styles.creatorHandle}>@{post.username}</Text>
          </View>
          {post.is_verified ? <Badge label="✓ Verified" /> : null}
        </View>
        <Text style={styles.title}>{post.title}</Text>
        {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
        <View style={styles.tags}>
          {(post.tags || []).map((t) => <Badge key={t} label={`#${t}`} color={Colors.textMuted} />)}
        </View>
        <Text style={styles.meta}>{post.view_count} views · {new Date(post.created_at).toLocaleDateString()}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[5], gap: Spacing[4] },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  creatorName: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.base, color: Colors.text },
  creatorHandle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes['2xl'], color: Colors.text },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted, lineHeight: Typography.sizes.base * 1.7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  meta: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.textFaint },
});
