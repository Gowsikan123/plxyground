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
      const { data, error: requestError } = await getCreatorProfile(id);
      if (requestError) setError(requestError);
      else setProfile(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.page}>
        <Header title="Creator" showBack />
        {[1, 2, 3].map((key) => <SkeletonCard key={key} />)}
      </View>
    );
  }

  if (error || !profile?.creator) {
    return (
      <View style={styles.page}>
        <Header title="Creator" showBack />
        <EmptyState title="Creator not found" message={error || ''} />
      </View>
    );
  }

  const creator = profile.creator;

  return (
    <View style={styles.page}>
      <Header title={creator.display_name} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar uri={creator.avatar_url} name={creator.display_name} size={72} />
          <View style={styles.info}>
            <Text style={styles.name}>{creator.display_name}</Text>
            <Text style={styles.handle}>@{creator.username}</Text>
            {creator.is_verified ? <Badge label="Verified" /> : null}
          </View>
        </View>
        {creator.bio ? <Text style={styles.bio}>{creator.bio}</Text> : null}
        <View style={styles.stats}>
          {creator.sport ? <Text style={styles.stat}>Sport: {creator.sport}</Text> : null}
          {creator.location ? <Text style={styles.stat}>Location: {creator.location}</Text> : null}
          <Text style={styles.stat}>Followers: {creator.follower_count || 0}</Text>
        </View>
        <Text style={styles.sectionTitle}>Posts</Text>
        {(profile.posts || []).map((post) => (
          <PostCard
            key={post.id}
            post={{
              ...post,
              display_name: creator.display_name,
              username: creator.username,
              creator_id: creator.id,
              avatar_url: creator.avatar_url,
              is_verified: creator.is_verified,
            }}
          />
        ))}
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
