import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { creatorService } from '../../services/creatorService';
import ContentCard from '../../components/ContentCard';
import SkeletonCard from '../../components/SkeletonCard';

export default function CreatorProfileScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await creatorService.getBySlug(slug);
      if (err) { setError(err); setLoading(false); return; }
      setCreator(data.creator);
      setPosts(data.posts || []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !creator) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Creator not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        {creator.avatar_url ? (
          <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {creator.display_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.displayName}>{creator.display_name}</Text>
        <Text style={styles.handle}>@{creator.username}</Text>
        {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{creator.follower_count ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posts</Text>
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        ) : (
          posts.map((post) => <ContentCard key={post.id} item={post} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.xs },
  backLabel: { color: COLORS.text, ...TYPOGRAPHY.body },
  header: { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: SPACING.sm },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '700' },
  displayName: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: 4 },
  handle: { ...TYPOGRAPHY.body, color: COLORS.textMuted, marginBottom: SPACING.sm },
  bio: { ...TYPOGRAPHY.body, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.md },
  stats: { flexDirection: 'row', gap: SPACING.xl },
  stat: { alignItems: 'center' },
  statNum: { ...TYPOGRAPHY.h3, color: COLORS.text },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  section: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.md },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.error, marginVertical: SPACING.md },
  backBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: 8 },
  backBtnText: { color: '#fff', ...TYPOGRAPHY.label },
});
