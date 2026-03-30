import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, StatusBar, SafeAreaView, Share, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TYPE_COLORS = {
  article: { bg: '#1a2744', text: '#60a5fa', label: '📝 Article' },
  video_embed: { bg: '#1a1a2e', text: '#a78bfa', label: '🎥 Video' },
  image_story: { bg: '#1a2420', text: '#34d399', label: '📸 Story' },
};

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    apiRequest(`/api/content/${id}`)
      .then(data => { setPost(data); setLoading(false); })
      .catch(() => { setError('Post not found'); setLoading(false); });
  }, [id]);

  const handleShare = async () => {
    if (!post) return;
    await Share.share({ message: `${post.title} — on PLXYGROUND`, title: post.title });
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Post not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const typeInfo = TYPE_COLORS[post.content_type] || TYPE_COLORS.article;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.inner}>

        <View style={styles.heroWrap}>
          <Image source={{ uri: post.media_url }} style={styles.hero} />
          <LinearGradient colors={['rgba(8,12,20,0.5)', 'rgba(8,12,20,0.95)']} style={styles.heroGradient} />
          <TouchableOpacity style={styles.heroBack} onPress={() => router.back()}>
            <View style={styles.heroBackBtn}><Text style={styles.heroBackText}>←</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroShare} onPress={handleShare}>
            <View style={styles.heroShareBtn}><Text style={styles.heroShareText}>↗</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.text }]}>{typeInfo.label}</Text>
            </View>
            <Text style={styles.date}>{new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>

          <Text style={styles.title}>{post.title}</Text>

          <TouchableOpacity style={styles.creatorRow} onPress={() => {}}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>{post.creator_name?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{post.creator_name}</Text>
              <Text style={styles.creatorHandle}>@{post.profile_slug}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.body}>{post.body}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  inner: { paddingBottom: 60 },
  errorEmoji: { fontSize: 48 },
  errorTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '600' },
  backBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  backBtnText: { color: '#60a5fa', fontWeight: '700' },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 320 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  heroBack: { position: 'absolute', top: 16, left: 16 },
  heroBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(8,12,20,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroBackText: { color: '#fff', fontSize: 18 },
  heroShare: { position: 'absolute', top: 16, right: 16 },
  heroShareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(8,12,20,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroShareText: { color: '#fff', fontSize: 18 },
  content: { padding: 24 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  date: { color: '#475569', fontSize: 13 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 34, letterSpacing: -0.5, marginBottom: 20 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2563eb' },
  creatorAvatarText: { color: '#60a5fa', fontSize: 18, fontWeight: '800' },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  creatorHandle: { color: '#475569', fontSize: 13, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#1a2035', marginBottom: 20 },
  body: { color: '#94a3b8', fontSize: 16, lineHeight: 28 },
});