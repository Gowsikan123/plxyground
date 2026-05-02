import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { creatorService } from '../../services/creatorService';
import { contentService } from '../../services/contentService';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import PostCard from '../../components/feed/PostCard';

export default function CreatorProfileScreen() {
  const { slug } = useLocalSearchParams();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await creatorService.getBySlug(slug);
      if (err) { setError(err); setLoading(false); return; }
      setCreator(data.creator);
      const { data: cd } = await contentService.feed({ creatorId: data.creator.id, limit: 20 });
      if (cd) setPosts(cd.content || []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  if (error || !creator) return <View style={styles.center}><Text style={styles.errorText}>{error || 'Creator not found'}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>

      <View style={styles.header}>
        <Avatar uri={creator.avatar_url} name={creator.display_name || creator.username} size={72} />
        <View style={styles.meta}>
          <Text style={styles.displayName}>{creator.display_name || creator.username}</Text>
          <Text style={styles.username}>@{creator.username}</Text>
          {creator.sports_niche && <Badge label={creator.sports_niche} color={COLORS.primary} style={{ marginTop: SPACING[1] }} />}
        </View>
      </View>

      {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statVal}>{creator.post_count ?? 0}</Text><Text style={styles.statLbl}>Posts</Text></View>
        <View style={styles.stat}><Text style={styles.statVal}>{creator.total_views ?? 0}</Text><Text style={styles.statLbl}>Views</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Content</Text>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING[4], paddingBottom: SPACING[16] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { marginBottom: SPACING[4] },
  backText: { ...TYPOGRAPHY.bodySm, color: COLORS.primary },
  header: { flexDirection: 'row', gap: SPACING[4], marginBottom: SPACING[4] },
  meta: { flex: 1, justifyContent: 'center' },
  displayName: { ...TYPOGRAPHY.headingLg, color: COLORS.text },
  username: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  bio: { ...TYPOGRAPHY.bodyMd, color: COLORS.text, marginBottom: SPACING[4] },
  statsRow: { flexDirection: 'row', gap: SPACING[4], marginBottom: SPACING[6] },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING[4], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statVal: { ...TYPOGRAPHY.headingMd, color: COLORS.text },
  statLbl: { ...TYPOGRAPHY.labelSm, color: COLORS.textMuted },
  sectionTitle: { ...TYPOGRAPHY.headingMd, color: COLORS.text, marginBottom: SPACING[3] },
  errorText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error },
});
