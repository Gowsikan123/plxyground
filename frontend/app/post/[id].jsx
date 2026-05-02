import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { ENDPOINTS } from '../../constants/api';

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`${ENDPOINTS.CONTENT}/${id}`).then(({ data }) => {
      setPost(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <View style={[styles.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.primary} /></View>;
  if (!post) return <View style={[styles.center, { paddingTop: insets.top }]}><Text style={styles.err}>Post not found.</Text></View>;

  const tags = Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : []);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      {post.media_url && post.media_type === 'image' && (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      )}
      <TouchableOpacity style={styles.creator} onPress={() => router.push(`/creator/${post.creator_slug}`)}>
        <Avatar uri={post.avatar_url} name={post.display_name || 'U'} size={40} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.creatorName}>{post.display_name} {post.is_verified ? '✓' : ''}</Text>
          {post.sport && <Text style={styles.sport}>{post.sport}</Text>}
        </View>
      </TouchableOpacity>
      <Text style={styles.title}>{post.title}</Text>
      {post.body && <Text style={styles.body}>{post.body}</Text>}
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((t, i) => <Badge key={i} label={`#${t}`} variant="muted" />)}
        </View>
      )}
      <View style={styles.meta}>
        <Text style={styles.metaText}>👁 {post.view_count || 0} views</Text>
        <Text style={styles.metaText}>❤️ {post.like_count || 0} likes</Text>
        <Text style={styles.metaText}>{new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  back: { marginBottom: 16 },
  backText: { color: Colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  media: { width: '100%', height: 260, borderRadius: 12, marginBottom: 16 },
  creator: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  creatorName: { color: Colors.text, fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  sport: { color: Colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  title: { color: Colors.text, fontSize: 22, fontFamily: 'Syne_700Bold', lineHeight: 28, marginBottom: 12 },
  body: { color: Colors.textMuted, fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22, marginBottom: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  meta: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  metaText: { color: Colors.textFaint, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  err: { color: Colors.textMuted, fontFamily: 'DMSans_400Regular' },
});
