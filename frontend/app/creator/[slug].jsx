import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import SafeScreen from '../../components/layout/SafeScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import ContentCard from '../../components/ContentCard';
import creatorService from '../../services/creatorService';

export default function CreatorProfile() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await creatorService.getBySlug(slug);
        if (err) throw new Error(err);
        setCreator(data.creator);
        setPosts(data.posts || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <SafeScreen>
        <ScreenHeader title="Creator" />
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      </SafeScreen>
    );
  }

  if (error || !creator) {
    return (
      <SafeScreen>
        <ScreenHeader title="Creator" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Creator not found'}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScreenHeader title={creator.display_name} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar uri={creator.avatar_url} name={creator.display_name} size={72} />
          <Text style={styles.name}>{creator.display_name}</Text>
          <Text style={styles.handle}>@{creator.username}</Text>
          {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}
          <View style={styles.badges}>
            {creator.sport && <Badge label={creator.sport} />}
            {creator.location && <Badge label={creator.location} variant="muted" />}
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{creator.follower_count ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Posts</Text>
        {posts.length === 0 ? (
          <Text style={styles.empty}>No posts yet.</Text>
        ) : (
          posts.map((p) => (
            <ContentCard
              key={p.id}
              post={p}
              onPress={() => router.push(`/post/${p.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.error, fontFamily: TYPOGRAPHY.fonts.body, fontSize: TYPOGRAPHY.sizes.base },
  hero: { alignItems: 'center', padding: SPACING.lg, gap: SPACING.sm },
  name: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  handle: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
  },
  bio: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  badges: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm },
  stat: { alignItems: 'center' },
  statValue: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  empty: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});
