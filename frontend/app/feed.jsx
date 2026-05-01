import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, RefreshControl, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../components/BottomNav';
import SkeletonCard from '../components/SkeletonCard';
import { C, R, S, GRAD_ACCENT, GRAD_CARD } from '../components/theme';

const { width } = Dimensions.get('window');

const TYPE_META = {
  article:     { color: C.accent,  bg: C.article.bg,  label: 'Article' },
  video_embed: { color: C.purple,  bg: C.video.bg,    label: 'Video'   },
  image_story: { color: C.green,   bg: C.story.bg,    label: 'Story'   },
};

export default function Feed() {
  const [posts, setPosts]         = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const load = async (q = '') => {
    try {
      const data = await apiRequest(`/api/content?search=${encodeURIComponent(q)}&limit=50`);
      setPosts(data.data || []);
      setError('');
    } catch {
      setError('Failed to load. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const onRefresh = () => { setRefreshing(true); load(search); };

  const renderPost = ({ item }) => {
    const meta = TYPE_META[item.content_type] || TYPE_META.article;
    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/post/${item.id}`)} activeOpacity={0.92}>
        <View style={s.imgWrap}>
          <Image
            source={{ uri: item.media_url }}
            style={s.img}
            defaultSource={require('../assets/placeholder.png')}
          />
          <LinearGradient colors={GRAD_CARD} style={s.imgOverlay} />
          <View style={[s.badge, { backgroundColor: meta.bg }]}>
            <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={s.body}>
          <View style={s.metaRow}>
            <View style={s.creator}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.creator_name?.[0]?.toUpperCase()}</Text>
              </View>
              <Text style={s.creatorName} numberOfLines={1}>{item.creator_name}</Text>
            </View>
            <Text style={s.date}>{new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
          </View>
          <Text style={s.title} numberOfLines={2}>{item.title}</Text>
          <Text style={s.excerpt} numberOfLines={2}>{item.body}</Text>
          <View style={s.footer}>
            <Text style={s.readMore}>Read more →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>PLXYGROUND</Text>
          <Text style={s.logoSub}>Sports Creator Network</Text>
        </View>
        {token && (
          <TouchableOpacity style={s.createWrap} onPress={() => router.push('/create')} activeOpacity={0.85}>
            <LinearGradient colors={GRAD_ACCENT} style={s.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.createBtnText}>+ Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search posts, creators..."
          placeholderTextColor={C.textFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={s.clearBtn}>
            <Text style={s.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={s.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={i => String(i.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>⚡</Text>
              <Text style={s.emptyTitle}>Nothing here yet</Text>
              <Text style={s.emptySub}>Be the first creator to post</Text>
              {token && (
                <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/create')}>
                  <Text style={s.emptyBtnText}>Create Post</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={renderPost}
        />
      )}

      {token && <BottomNav />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  logo:         { color: C.text, fontSize: 17, fontWeight: '900', letterSpacing: 2.5 },
  logoSub:      { color: C.textMuted, fontSize: 11, marginTop: 2 },
  createWrap:   { borderRadius: R.full, overflow: 'hidden' },
  createBtn:    { paddingHorizontal: 18, paddingVertical: 9, borderRadius: R.full },
  createBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: R.lg, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchIcon:   { fontSize: 14, marginRight: 8, opacity: 0.5 },
  searchInput:  { flex: 1, color: C.text, paddingVertical: 13, fontSize: 14 },
  clearBtn:     { padding: 8 },
  clearText:    { color: C.textMuted, fontSize: 13 },
  errorBox:     { backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#7F1D1D', padding: 12, marginHorizontal: 16, borderRadius: R.md, marginBottom: 8 },
  errorText:    { color: C.red, fontSize: 13 },
  list:         { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:    { fontSize: 52 },
  emptyTitle:   { color: C.text, fontSize: 20, fontWeight: '800' },
  emptySub:     { color: C.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn:     { backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: R.md, marginTop: 8 },
  emptyBtnText: { color: C.accent, fontWeight: '700' },
  // Card
  card:         { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  imgWrap:      { position: 'relative' },
  img:          { width: '100%', height: 220, backgroundColor: C.surface2 },
  imgOverlay:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  badge:        { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full },
  badgeText:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  body:         { padding: 18 },
  metaRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  creator:      { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:       { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accentDark, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: C.accent, fontSize: 12, fontWeight: '800' },
  creatorName:  { color: C.textMuted, fontSize: 13, fontWeight: '600', flex: 1 },
  date:         { color: C.textFaint, fontSize: 12 },
  title:        { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8, lineHeight: 26, letterSpacing: -0.3 },
  excerpt:      { color: C.textMuted, fontSize: 14, lineHeight: 22 },
  footer:       { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  readMore:     { color: C.accent, fontSize: 13, fontWeight: '700' },
});
