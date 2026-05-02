import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ContentCard } from '../../components/ContentCard';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { ENDPOINTS } from '../../constants/api';

export default function CreatorProfile() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${ENDPOINTS.CREATORS}/${slug}`),
      api.get(ENDPOINTS.CONTENT, { creator_slug: slug, limit: 20 }),
    ]).then(([c, p]) => {
      setCreator(c.data);
      setPosts(p.data?.content || p.data || []);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <View style={[styles.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.primary} /></View>;
  if (!creator) return <View style={[styles.center, { paddingTop: insets.top }]}><Text style={styles.err}>Creator not found.</Text></View>;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.profileRow}>
          <Avatar uri={creator.avatar_url} name={creator.display_name} size={72} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{creator.display_name}</Text>
              {creator.is_verified && <Text style={styles.tick}> ✓</Text>}
            </View>
            <Text style={styles.handle}>@{creator.username}</Text>
            <View style={styles.badges}>
              {creator.sport && <Badge label={creator.sport} variant="primary" />}
              {creator.location && <Badge label={creator.location} variant="muted" />}
            </View>
          </View>
        </View>
        {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{(creator.follower_count || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>
      </View>
      <View style={styles.postsSection}>
        <Text style={styles.postsHeading}>Posts</Text>
        {posts.map((p) => <ContentCard key={p.id} item={p} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerPad: { padding: 16 },
  back: { marginBottom: 16 },
  backText: { color: Colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  info: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: Colors.text, fontSize: 20, fontFamily: 'Syne_700Bold' },
  tick: { color: Colors.verified, fontSize: 16 },
  handle: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  bio: { color: Colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20, marginBottom: 16 },
  stats: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 8, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { color: Colors.text, fontSize: 20, fontFamily: 'Syne_700Bold' },
  statLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  postsSection: { padding: 12 },
  postsHeading: { color: Colors.text, fontSize: 18, fontFamily: 'Syne_700Bold', marginBottom: 12 },
  err: { color: Colors.textMuted, fontFamily: 'DMSans_400Regular' },
});
