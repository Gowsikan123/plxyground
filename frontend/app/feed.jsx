import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, RefreshControl, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../components/BottomNav';
import SkeletonCard from '../components/SkeletonCard';
import { C, R, GRAD_HERO, GRAD_CARD } from '../components/theme';

const { width } = Dimensions.get('window');

const DEMO_POSTS = [
  {
    id: 'demo-1',
    title: 'How I trained for my first 100m final at 17',
    body: 'I want to take you behind the scenes of the most gruelling six months of my life. Early mornings, ice baths, and one coach who never let me settle.',
    content_type: 'article',
    creator_name: 'Emma Singh',
    creator_id: 'demo',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    media_url: null,
  },
  {
    id: 'demo-2',
    title: 'My pre-game routine — the stuff nobody talks about',
    body: 'Visualisation, journalling, and why I stopped listening to hype music before matches. The mental side is the real game.',
    content_type: 'video_embed',
    creator_name: 'Jayden Carter',
    creator_id: 'demo',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    media_url: null,
  },
  {
    id: 'demo-3',
    title: 'From local courts to signed deal — my journey',
    body: 'Two years ago I was playing in a community rec league. Here is exactly what changed and what I would tell myself back then.',
    content_type: 'image_story',
    creator_name: 'Kai Thompson',
    creator_id: 'demo',
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    media_url: null,
  },
  {
    id: 'demo-4',
    title: 'Nutrition on a budget — what actually works',
    body: 'High performance eating does not have to cost a fortune. I spent a month tracking every meal under £40 a week and here are the results.',
    content_type: 'article',
    creator_name: 'Sara Okafor',
    creator_id: 'demo',
    published_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    media_url: null,
  },
  {
    id: 'demo-5',
    title: 'Why I turned down my first sponsorship offer',
    body: 'The numbers looked great on paper. But something felt off. Here is how I evaluated the deal and what I learned from walking away.',
    content_type: 'article',
    creator_name: 'Leo Martinez',
    creator_id: 'demo',
    published_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    media_url: null,
  },
];

const TYPE_META = {
  article:     { color: C.cyan,   bg: C.article?.bg, label: 'Article', grad: ['#00D4FF','#0099CC'] },
  video_embed: { color: C.purple, bg: C.video?.bg,   label: 'Video',   grad: ['#BF5FFF','#8B2FCC'] },
  image_story: { color: C.lime,   bg: C.story?.bg,   label: 'Story',   grad: ['#AAFF00','#7DCC00'] },
};

const FILTERS = ['All', 'Article', 'Video', 'Story'];

export default function Feed() {
  const [posts, setPosts]           = useState([]);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const load = async (q = '') => {
    try {
      const data = await apiRequest(`/api/content?search=${encodeURIComponent(q)}&limit=50`);
      const live = data?.data || [];
      // Show demo posts if the API returns nothing yet
      setPosts(live.length > 0 ? live : DEMO_POSTS);
      setError('');
    } catch {
      // On error, still show demo content so the screen is never blank
      setPosts(DEMO_POSTS);
      setError('');
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
    const meta = TYPE_META[item.content_type] || TYPE_META.article;
    const isFeatured = index === 0 && filter === 'All';
    const initials = item.creator_name?.[0]?.toUpperCase() ?? '?';
    return (
      <TouchableOpacity
        style={[s.card, isFeatured && s.featuredCard]}
        onPress={() => item.id?.toString().startsWith('demo') ? null : router.push(`/post/${item.id}`)}
        activeOpacity={0.90}
      >
        {/* Colour band replaces image when there is no media_url */}
        <View style={s.imgWrap}>
          {item.media_url ? (
            <Image source={{ uri: item.media_url }} style={[s.img, isFeatured && s.featuredImg]} />
          ) : (
            <LinearGradient
              colors={meta.grad}
              style={[s.img, isFeatured && s.featuredImg, s.imgPlaceholder]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={s.imgPlaceholderText}>{meta.label}</Text>
            </LinearGradient>
          )}
          {item.media_url && <LinearGradient colors={GRAD_CARD} style={s.imgOverlay} />}
          <LinearGradient colors={meta.grad} style={s.typePill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.typePillText}>{meta.label}</Text>
          </LinearGradient>
          {isFeatured && <View style={s.featuredTag}><Text style={s.featuredTagText}>✦ Featured</Text></View>}
        </View>
        <View style={s.cardBody}>
          <View style={s.metaRow}>
            <View style={s.creatorRow}>
              <LinearGradient colors={GRAD_HERO} style={s.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.avatarText}>{initials}</Text>
              </LinearGradient>
              <Text style={s.creatorName} numberOfLines={1}>{item.creator_name}</Text>
            </View>
            <Text style={s.date}>{new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
          </View>
          <Text style={[s.cardTitle, isFeatured && s.featuredTitle]} numberOfLines={isFeatured ? 3 : 2}>{item.title}</Text>
          <Text style={s.excerpt} numberOfLines={2}>{item.body}</Text>
          <View style={s.cardFooter}>
            <Text style={[s.readMore, { color: meta.color }]}>Read more →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>PLXYGROUND</Text>
          <Text style={s.logoSub}>Sports Creator Network</Text>
        </View>
        {token && (
          <TouchableOpacity onPress={() => router.push('/create')} activeOpacity={0.85}>
            <LinearGradient colors={GRAD_HERO} style={s.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.createBtnText}>+ Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search creators & posts…" placeholderTextColor={C.textFaint} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={s.clearText}>✕</Text></TouchableOpacity> : null}
      </View>

      {/* Filter chips */}
      <View style={s.filters}>
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <TouchableOpacity key={f} style={[s.chip, active && s.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
              {active
                ? <LinearGradient colors={GRAD_HERO} style={s.chipGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Text style={s.chipActiveText}>{f}</Text></LinearGradient>
                : <Text style={s.chipText}>{f}</Text>
              }
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.list}>
          <SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={i => String(i.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderPost}
        />
      )}

      {token && <BottomNav />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  logo:             { color: C.text, fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  logoSub:          { color: C.textMuted, fontSize: 10, marginTop: 1, letterSpacing: 0.3 },
  createBtn:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: R.full },
  createBtnText:    { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  searchBar:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: R.lg, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchIcon:       { fontSize: 14, marginRight: 8, opacity: 0.5 },
  searchInput:      { flex: 1, color: C.text, paddingVertical: 13, fontSize: 14 },
  clearText:        { color: C.textMuted, fontSize: 14, padding: 8 },
  filters:          { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  chip:             { borderRadius: R.full, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  chipActive:       { borderColor: 'transparent' },
  chipGrad:         { paddingHorizontal: 16, paddingVertical: 8 },
  chipText:         { color: C.textMuted, fontSize: 13, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 8 },
  chipActiveText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  list:             { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  card:             { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  featuredCard:     { borderColor: 'rgba(255,77,109,0.3)', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  imgWrap:          { position: 'relative' },
  img:              { width: '100%', height: 210, backgroundColor: C.surface2 },
  featuredImg:      { height: 260 },
  imgOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  imgPlaceholder:   { alignItems: 'center', justifyContent: 'center' },
  imgPlaceholderText: { color: 'rgba(255,255,255,0.5)', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  typePill:         { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full },
  typePillText:     { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  featuredTag:      { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full },
  featuredTagText:  { color: C.gold, fontSize: 11, fontWeight: '700' },
  cardBody:         { padding: 16 },
  metaRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  creatorRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:           { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { color: '#fff', fontSize: 11, fontWeight: '900' },
  creatorName:      { color: C.textMuted, fontSize: 13, fontWeight: '600', flex: 1 },
  date:             { color: C.textFaint, fontSize: 12 },
  cardTitle:        { color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 7, lineHeight: 24, letterSpacing: -0.3 },
  featuredTitle:    { fontSize: 20, lineHeight: 28 },
  excerpt:          { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  cardFooter:       { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  readMore:         { fontSize: 13, fontWeight: '700' },
});
