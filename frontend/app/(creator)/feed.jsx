import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, RefreshControl, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../../components/BottomNav';
import SkeletonCard from '../../components/SkeletonCard';
import { C, R, GRAD_ACCENT, GRAD_CARD, GRAD_SURFACE } from '../../components/theme';

const { width } = Dimensions.get('window');

const DEMO_POSTS = [
  { id: 'demo-1', title: 'How I trained for my first 100m final at 17', body: 'I want to take you behind the scenes of the most gruelling six months of my life. Early mornings, ice baths, and one coach who never let me settle.', content_type: 'article', creator_name: 'Emma Singh', creator_id: 'demo', published_at: new Date(Date.now() - 2 * 86400000).toISOString(), media_url: null },
  { id: 'demo-2', title: 'My pre-game routine — the stuff nobody talks about', body: 'Visualisation, journalling, and why I stopped listening to hype music before matches. The mental side is the real game.', content_type: 'video_embed', creator_name: 'Jayden Carter', creator_id: 'demo', published_at: new Date(Date.now() - 4 * 86400000).toISOString(), media_url: null },
  { id: 'demo-3', title: 'From local courts to a signed deal — my journey', body: 'Two years ago I was playing in a community rec league. Here is exactly what changed and what I would tell myself back then.', content_type: 'image_story', creator_name: 'Kai Thompson', creator_id: 'demo', published_at: new Date(Date.now() - 7 * 86400000).toISOString(), media_url: null },
  { id: 'demo-4', title: 'Nutrition on a budget — what actually works', body: 'High performance eating does not have to cost a fortune. I spent a month tracking every meal under £40 a week and here are the results.', content_type: 'article', creator_name: 'Sara Okafor', creator_id: 'demo', published_at: new Date(Date.now() - 10 * 86400000).toISOString(), media_url: null },
  { id: 'demo-5', title: 'Why I turned down my first sponsorship offer', body: 'The numbers looked great on paper. But something felt off. Here is how I evaluated the deal and what I learned from walking away.', content_type: 'article', creator_name: 'Leo Martinez', creator_id: 'demo', published_at: new Date(Date.now() - 14 * 86400000).toISOString(), media_url: null },
  { id: 'demo-6', title: 'Behind the lens: shooting my own brand content', body: 'No agency. No budget. Just an iPhone 14 and a lot of learning. Here is the exact workflow I use to create content that lands brand deals.', content_type: 'video_embed', creator_name: 'Priya Nair', creator_id: 'demo', published_at: new Date(Date.now() - 18 * 86400000).toISOString(), media_url: null },
];

const TYPE_LABEL = { article: 'Article', video_embed: 'Video', image_story: 'Story' };
const FILTERS = ['All', 'Article', 'Video', 'Story'];

export default function Feed() {
  const [posts, setPosts]           = useState([]);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const load = async (q = '') => {
    try {
      const data = await apiRequest(`/api/content?search=${encodeURIComponent(q)}&limit=50`);
      const live = data?.data || [];
      setPosts(live.length > 0 ? live : DEMO_POSTS);
    } catch {
      setPosts(DEMO_POSTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => load(search), 400); return () => clearTimeout(t); }, [search]);

  const onRefresh = () => { setRefreshing(true); load(search); };

  const displayed = filter === 'All' ? posts : posts.filter(p => {
    if (filter === 'Article') return p.content_type === 'article';
    if (filter === 'Video')   return p.content_type === 'video_embed';
    if (filter === 'Story')   return p.content_type === 'image_story';
    return true;
  });

  const renderPost = ({ item, index }) => {
    const label = TYPE_LABEL[item.content_type] || 'Post';
    const isFeatured = index === 0 && filter === 'All';
    const initials = item.creator_name?.[0]?.toUpperCase() ?? '?';
    const isDemo = String(item.id).startsWith('demo');
    const daysAgo = Math.floor((Date.now() - new Date(item.published_at)) / 86400000);
    const dateStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return (
      <TouchableOpacity
        style={[s.card, isFeatured && s.featuredCard]}
        onPress={() => isDemo ? null : router.push(`/post/${item.id}`)}
        activeOpacity={isDemo ? 1 : 0.88}
      >
        {/* Placeholder image block */}
        <View style={[s.imgWrap, isFeatured && s.featuredImgWrap]}>
          {item.media_url ? (
            <Image source={{ uri: item.media_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[s.imgPlaceholder, isFeatured && s.featuredImgPlaceholder]}>
              <Text style={s.imgPlaceholderLabel}>{label.toUpperCase()}</Text>
            </View>
          )}
          {item.media_url && <LinearGradient colors={GRAD_CARD} style={StyleSheet.absoluteFill} />}
          {/* Type pill */}
          <View style={s.typePill}>
            <Text style={s.typePillText}>{label}</Text>
          </View>
          {isFeatured && (
            <View style={s.featuredTag}><Text style={s.featuredTagText}>Featured</Text></View>
          )}
        </View>

        {/* Card body */}
        <View style={s.cardBody}>
          <View style={s.metaRow}>
            <View style={s.creatorRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <Text style={s.creatorName} numberOfLines={1}>{item.creator_name}</Text>
            </View>
            <Text style={s.date}>{dateStr}</Text>
          </View>
          <Text style={[s.cardTitle, isFeatured && s.featuredTitle]} numberOfLines={isFeatured ? 3 : 2}>
            {item.title}
          </Text>
          <Text style={s.excerpt} numberOfLines={2}>{item.body}</Text>
          <View style={s.cardFooter}>
            <Text style={s.readMore}>{isDemo ? 'Demo' : 'Read more →'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>PLXYGROUND</Text>
          <Text style={s.logoSub}>Sports Creator Network</Text>
        </View>
        {token && (
          <TouchableOpacity onPress={() => router.push('/(creator)/create')} activeOpacity={0.85}>
            <LinearGradient colors={GRAD_ACCENT} style={s.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.createBtnText}>+ Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search creators & posts…"
          placeholderTextColor={C.textFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <View style={s.filters}>
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, active && s.chipActiveText]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.list}><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={i => String(i.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderPost}
        />
      )}

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: C.bg },

  // Header
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
  logo:                 { color: C.text, fontSize: 15, fontWeight: '900', letterSpacing: 3 },
  logoSub:              { color: C.textMuted, fontSize: 10, marginTop: 1, letterSpacing: 0.5 },
  createBtn:            { paddingHorizontal: 18, paddingVertical: 9, borderRadius: R.full },
  createBtnText:        { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Search
  searchBar:            { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: R.md, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, height: 44 },
  searchIcon:           { color: C.textFaint, fontSize: 18, marginRight: 8 },
  searchInput:          { flex: 1, color: C.text, fontSize: 14 },
  clearText:            { color: C.textMuted, fontSize: 14, padding: 8 },

  // Filters
  filters:              { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  chip:                 { paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  chipActive:           { borderColor: C.accent, backgroundColor: C.accentDim },
  chipText:             { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  chipActiveText:       { color: C.accent, fontWeight: '700' },

  // List
  list:                 { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },

  // Card
  card:                 { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  featuredCard:         { borderColor: C.borderBright },

  // Image
  imgWrap:              { height: 200, backgroundColor: C.surface2, position: 'relative', overflow: 'hidden' },
  featuredImgWrap:      { height: 250 },
  imgPlaceholder:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface2 },
  featuredImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface3 },
  imgPlaceholderLabel:  { color: C.textFaint, fontSize: 11, fontWeight: '800', letterSpacing: 3 },

  // Pill + tag
  typePill:             { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  typePillText:         { color: C.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  featuredTag:          { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent },
  featuredTagText:      { color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Card body
  cardBody:             { padding: 16 },
  metaRow:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  creatorRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:               { width: 26, height: 26, borderRadius: 13, backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.borderBright },
  avatarText:           { color: C.text, fontSize: 11, fontWeight: '800' },
  creatorName:          { color: C.textMuted, fontSize: 13, fontWeight: '500', flex: 1 },
  date:                 { color: C.textFaint, fontSize: 12 },
  cardTitle:            { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 6, lineHeight: 23, letterSpacing: -0.3 },
  featuredTitle:        { fontSize: 19, lineHeight: 27 },
  excerpt:              { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  cardFooter:           { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  readMore:             { fontSize: 13, fontWeight: '700', color: C.accent },
});
