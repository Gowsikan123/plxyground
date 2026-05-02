import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Share } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { contentService } from '../../services/contentService';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await contentService.getById(id);
      if (err) { setError(err); } else { setPost(data.post); }
      setLoading(false);
    })();
  }, [id]);

  const handleShare = async () => {
    if (!post) return;
    await Share.share({ message: `${post.title} — via PLXYGROUND`, url: post.media_url || '' });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  if (error || !post) return <View style={styles.center}><Text style={styles.errorText}>{error || 'Post not found'}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>

      {/* Creator info */}
      <Pressable style={styles.creatorRow} onPress={() => router.push(`/creator/${post.creator_slug || post.creator_id}`)}>        
        <Avatar uri={post.avatar_url} name={post.display_name || post.username} size={40} />
        <View>
          <Text style={styles.creatorName}>{post.display_name || post.username}</Text>
          <Text style={styles.creatorHandle}>@{post.username}</Text>
        </View>
      </Pressable>

      {/* Content */}
      <Text style={styles.title}>{post.title}</Text>
      {post.sports_niche && <Badge label={post.sports_niche} color={COLORS.primary} style={styles.badge} />}
      <Text style={styles.description}>{post.description}</Text>

      {/* Tags */}
      {post.sport_tags && (
        <View style={styles.tagRow}>
          {post.sport_tags.split(',').filter(Boolean).map((tag) => (
            <View key={tag} style={styles.tag}><Text style={styles.tagText}>#{tag.trim()}</Text></View>
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.stat}>👁 {post.view_count ?? 0} views</Text>
        <Text style={styles.stat}>❤️ {post.like_count ?? 0} likes</Text>
      </View>

      {/* Share */}
      <Pressable style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share Post</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING[6], paddingTop: SPACING[12], paddingBottom: SPACING[16] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { marginBottom: SPACING[6] },
  backText: { ...TYPOGRAPHY.bodySm, color: COLORS.primary },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], marginBottom: SPACING[4] },
  creatorName: { ...TYPOGRAPHY.labelLg, color: COLORS.text },
  creatorHandle: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  title: { ...TYPOGRAPHY.headingLg, color: COLORS.text, marginBottom: SPACING[3] },
  badge: { marginBottom: SPACING[3] },
  description: { ...TYPOGRAPHY.bodyMd, color: COLORS.text, lineHeight: 24, marginBottom: SPACING[4] },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2], marginBottom: SPACING[4] },
  tag: { backgroundColor: COLORS.surface, borderRadius: 6, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1], borderWidth: 1, borderColor: COLORS.border },
  tagText: { ...TYPOGRAPHY.labelSm, color: COLORS.textMuted },
  statsRow: { flexDirection: 'row', gap: SPACING[6], marginBottom: SPACING[6] },
  stat: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  shareBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING[4], alignItems: 'center' },
  shareBtnText: { ...TYPOGRAPHY.labelMd, color: COLORS.text },
  errorText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error },
});
