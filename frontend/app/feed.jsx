import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TYPE_COLORS = {
  article: { bg: '#1a2744', text: '#60a5fa', label: '📝 Article' },
  video_embed: { bg: '#1a1a2e', text: '#a78bfa', label: '🎥 Video' },
  image_story: { bg: '#1a2420', text: '#34d399', label: '📸 Story' },
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();
  const router = useRouter();

  const loadFeed = async (q = '') => {
    try {
      const data = await apiRequest(`/api/content?search=${encodeURIComponent(q)}&limit=50`);
      setPosts(data.data || []);
      setError('');
    } catch {
      setError('Failed to load feed. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);
  useEffect(() => {
    const t = setTimeout(() => loadFeed(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const onRefresh = () => { setRefreshing(true); loadFeed(search); };

  const renderPost = ({ item }) => {
    const typeInfo = TYPE_COLORS[item.content_type] || TYPE_COLORS.article;
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/post/${item.id}`)} activeOpacity={0.9}>
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: item.media_url }} style={styles.cardImage} />
          <LinearGradient colors={['transparent', 'rgba(8,12,20,0.8)']} style={styles.cardImageOverlay} />
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeInfo.text }]}>{typeInfo.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardMeta}>
            <View style={styles.creatorBadge}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>{item.creator_name?.[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.creatorName}>{item.creator_name}</Text>
            </View>
            <Text style={styles.cardDate}>{new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.body}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.readMore}>Read more →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>PLXYGROUND</Text>
          <Text style={styles.headerSub}>Sports Creator Feed</Text>
        </View>
        {token && (
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create')} activeOpacity={0.85}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.createBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.createBtnText}>+ Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Search posts, creators, topics..."
          placeholderTextColor="#334155"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={i => String(i.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏀</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Be the first to share something with the community</Text>
              {token && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/create')}>
                  <Text style={styles.emptyBtnText}>Create First Post</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={renderPost}
        />
      )}

      {token && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/feed')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navLabel, { color: '#3b82f6' }]}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/opportunities')}>
            <Text style={styles.navIcon}>O</Text>
            <Text style={styles.navLabel}>Opps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/create')}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.navCreateBtn}>
              <Text style={styles.navCreateIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#334155', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logo: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerSub: { color: '#334155', fontSize: 11, marginTop: 2 },
  createBtn: { borderRadius: 20, overflow: 'hidden' },
  createBtnGradient: { paddingHorizontal: 18, paddingVertical: 9 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1623', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1e293b' },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  search: { flex: 1, color: '#fff', paddingVertical: 13, fontSize: 14 },
  clearBtn: { padding: 8 },
  clearBtnText: { color: '#475569', fontSize: 13 },
  errorBox: { backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#7f1d1d', padding: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  errorText: { color: '#f87171', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub: { color: '#475569', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#60a5fa', fontWeight: '700' },
  card: { backgroundColor: '#0f1623', borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2035' },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 220 },
  cardImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  typeBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 18 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  creatorBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center' },
  creatorAvatarText: { color: '#60a5fa', fontSize: 12, fontWeight: '800' },
  creatorName: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  cardDate: { color: '#334155', fontSize: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10, lineHeight: 26, letterSpacing: -0.3 },
  cardText: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  cardFooter: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  readMore: { color: '#3b82f6', fontSize: 13, fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 22 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
