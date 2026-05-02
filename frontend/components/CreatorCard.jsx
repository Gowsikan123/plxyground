import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';

export function CreatorCard({ creator }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/creator/${creator.slug}`)}
    >
      <Avatar uri={creator.avatar_url} name={creator.display_name} size={52} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{creator.display_name}</Text>
          {creator.is_verified && <Text style={styles.tick}> ✓</Text>}
        </View>
        <Text style={styles.username}>@{creator.username}</Text>
        {creator.bio && <Text style={styles.bio} numberOfLines={2}>{creator.bio}</Text>}
        <View style={styles.meta}>
          {creator.sport && <Badge label={creator.sport} variant="primary" />}
          {creator.location && <Badge label={creator.location} variant="muted" />}
          <Text style={styles.followers}>{(creator.follower_count || 0).toLocaleString()} followers</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: Colors.borderMuted },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: Colors.text, fontSize: 15, fontFamily: 'Syne_700Bold' },
  tick: { color: Colors.verified, fontSize: 13 },
  username: { color: Colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  bio: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18, marginTop: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
  followers: { color: Colors.textFaint, fontSize: 11, fontFamily: 'DMSans_400Regular' },
});
