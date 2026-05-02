import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';

export function ContentCard({ item }) {
  const router = useRouter();
  const tags = Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : []);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      {item.media_url && item.media_type === 'image' && (
        <Image source={{ uri: item.media_url }} style={styles.media} resizeMode="cover" />
      )}
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.creator}
          onPress={() => router.push(`/creator/${item.creator_slug}`)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Avatar uri={item.avatar_url} name={item.display_name || 'U'} size={32} />
          <View style={styles.creatorInfo}>
            <View style={styles.creatorRow}>
              <Text style={styles.creatorName}>{item.display_name}</Text>
              {item.is_verified && <Text style={styles.tick}> ✓</Text>}
            </View>
            {item.sport && <Text style={styles.sport}>{item.sport}</Text>}
          </View>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {item.body && <Text style={styles.bodyText} numberOfLines={3}>{item.body}</Text>}
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.slice(0, 3).map((t, i) => (
              <Badge key={i} label={`#${t}`} variant="muted" />
            ))}
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.metaText}>👁 {item.view_count || 0}</Text>
          <Text style={styles.metaText}>❤️ {item.like_count || 0}</Text>
          <Text style={styles.metaText}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderMuted },
  media: { width: '100%', height: 200 },
  body: { padding: 14 },
  creator: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  creatorInfo: { marginLeft: 10, flex: 1 },
  creatorRow: { flexDirection: 'row', alignItems: 'center' },
  creatorName: { color: Colors.text, fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  tick: { color: Colors.verified, fontSize: 12 },
  sport: { color: Colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  title: { color: Colors.text, fontSize: 16, fontFamily: 'Syne_700Bold', lineHeight: 22, marginBottom: 6 },
  bodyText: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 19, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  meta: { flexDirection: 'row', gap: 16 },
  metaText: { color: Colors.textFaint, fontSize: 12, fontFamily: 'DMSans_400Regular' },
});
