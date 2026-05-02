import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getCreatorProfile } from '../../services/creatorService';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { PostCard } from '../../components/feed/PostCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export default function CreatorProfile() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await getCreatorProfile(id);
      if (err) setError(err);
      else setProfile(data.data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <View style={styles.page}>
      <Header title="Creator" showBack />
      {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
    </View>
  );

  if (error || !profile) return (
    <View style={styles.page}>
      <Header title="Creator" showBack />
      <EmptyState title="Creator not found" message={error || ''} />
    </View>
  );

  return (
    <View style={styles.page}>
      <Header title={profile.display_name} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar uri={profile.avatar_url} name={profile.display_name} size={72} />
          <View style={styles.info}>
            <Text style={styles.name}>{profile.display_name}</Text>
            <Text style={styles.handle}>@{profile.username}</Text>
            {profile.is_verified ? <Badge label="✓ Verified" /> : null}
          </View>
        </View>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <View style={styles.stats}>
          {profile.sport ? <Text style={styles.stat}>🏆 {profile.sport}</Text> : null}
          {profile.location ? <Text style={styles.stat}>📍 {profile.location}</Text> : null}
          <Text style={styles.stat}>👥 {profile.follower_count} followers</Text>
        </View>
        <Text style={styles.sectionTitle}>Posts</Text>
        {(profile.posts || []).map((p) => <PostCard key={p.id} post={{ ...p, display_name: profile.display_name, username: profile.username, creator_slug: profile.slug, avatar_url: profile.avatar_url, is_verified: profile.is_verified }} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing[5], gap: Spacing[4] },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  info: { flex: 1, gap: Spacing[1] },
  name: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text },
  handle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  bio: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  stat: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
});
