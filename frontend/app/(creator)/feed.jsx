import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, RefreshControl, TextInput, Animated,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '../../utils/haptics';
import { C, R } from '../../components/theme';
import { Avatar } from '../../components/ui/Avatar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiRequest } from '../../components/ApiClient';
import { useAuthStore } from '../../store/authStore';
import { useSavedStore } from '../../store/savedStore';
import BottomNav from '../../components/BottomNav';

const FILTERS = ['All', 'Football', 'Basketball', 'Fitness', 'Nutrition', 'Mindset'];

// ─── Trending horizontal cards (ESPN/OneFootball style) ─────────────────────
function TrendingRow({ posts, onPress }) {
  if (!posts.length) return null;
  return (
    <View style={s.trendingWrap}>
      <View style={s.sectionHeader}>
        <View style={s.sectionAccentBar} />
        <Text style={s.sectionTitle}>TRENDING</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trendingScroll}>
        {posts.map((p, i) => (
          <TouchableOpacity key={p.id} style={s.trendingCard} onPress={() => onPress(p)} activeOpacity={0.82}>
            <View style={s.trendingRankBadge}>
              <Text style={s.trendingRankText}>#{i + 1}</Text>
            </View>
            <Text style={s.trendingTitle} numberOfLines={2}>{p.title}</Text>
            <View style={s.trendingFooter}>
              <Text style={s.trendingMeta} numberOfLines={1}>{p.display_name}</Text>
              <Text style={s.trendingViews}>{(p.view_count || 0).toLocaleString()} views</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Post card — Bleacher Report / ESPN style ───────────────────────────────
function PostCard({ post, saved, onSave, onPress, onCreatorPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const wordCount = post.body ? post.body.trim().split(/\s+/).length : 0;
  const readMins  = Math.max(1, Math.ceil(wordCount / 200));

  const categoryColor = C.accent;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={s.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Creator row */}
        <TouchableOpacity style={s.creatorRow} onPress={onCreatorPress} activeOpacity={0.7}>
          <Avatar uri={post.avatar_url} name={post.display_name} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={s.creatorName}>{post.display_name}</Text>
            <Text style={s.creatorHandle}>@{post.username}</Text>
          </View>
          {post.is_verified && (
            <View style={s.verifiedBadge}>
              <Text style={s.verifiedText}>✓ PRO</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.cardDivider} />

        {/* Tags row (category-first like ESPN) */}
        {post.tags?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.tagsRow}>
              {post.tags.slice(0, 5).map((t, idx) => (
                <View key={t} style={[s.tagChip, idx === 0 && s.tagChipFirst]}>
                  <Text style={[s.tagText, idx === 0 && s.tagTextFirst]}>#{t}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Title */}
        <Text style={s.cardTitle}>{post.title}</Text>

        {/* Preview body */}
        {post.body ? (
          <Text style={s.cardPreview} numberOfLines={2}>{post.body}</Text>
        ) : null}

        {/* Footer */}
        <View style={s.cardFooter}>
          <Text style={s.metaText}>
            {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {wordCount > 0 ? `  ·  ${readMins} min read` : ''}
            {`  ·  ${(post.view_count || 0).toLocaleString()} views`}
          </Text>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSave(post); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={{ fontSize: 18, color: saved ? C.accent : C.textFaint }}>
              {saved ? '🔖' : '🔲'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function Feed() {
  const router  = useRouter();
  const [posts, setPosts]         = useState([]);
  const [trending, setTrending]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const { toggle, isSaved }       = useSavedStore();
  const user                      = useAuthStore(s => s.user);

  const fetchPosts = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.set('tag', filter.toLowerCase());
      if (search.trim())    params.set('q', search.trim());
      const data = await apiRequest(`/api/content?${params}`);
      const all  = data.data || [];
      setPosts(all);
      const sorted = [...all].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      setTrending(sorted.slice(0, 4));
    } catch (_) {}
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(true); setRefreshing(false); };

  const ListHeader = (
    <View>
      {/* ── Trending strip ── */}
      <TrendingRow
        posts={trending}
        onPress={p => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${p.id}`); }}
      />

      {/* ── Filter chips ── */}
      <View style={s.sectionHeader}>
        <View style={s.sectionAccentBar} />
        <Text style={s.sectionTitle}>BROWSE</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersScroll}
        style={s.filtersBar}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={s.page}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Top header bar ── */}
      <View style={s.header}>
        <Text style={s.logo}>PLXY<Text style={s.logoAccent}>GROUND</Text></Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => router.push('/saved')} style={s.iconBtn}>
            <Text style={s.iconBtnText}>🔖</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(creator)/profile')} style={s.avatarBtn}>
            <Avatar uri={user?.avatar_url} name={user?.display_name} size={30} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={s.searchWrap}>
        <View style={s.searchInner}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search posts, creators…"
            placeholderTextColor={C.textFaint}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => fetchPosts()}
          />
        </View>
      </View>

      {/* ── List ── */}
      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={i => String(i)}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => String(p.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              saved={isSaved(item.id)}
              onSave={post => toggle(post)}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${item.id}`); }}
              onCreatorPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/creator/${item.creator_id}`); }}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState title="No posts yet" message="Be the first to post something great." />
          }
          // paddingBottom accounts for the floating BottomNav height (~80px)
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Bottom navigation ── */}
      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: C.bg },

  // Header
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 10 },
  logo:              { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  logoAccent:        { color: C.accent },
  headerRight:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:           { padding: 6 },
  iconBtnText:       { fontSize: 20 },
  avatarBtn:         { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: C.accent },

  // Search
  searchWrap:        { paddingHorizontal: 14, paddingBottom: 10 },
  searchInner:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.xl, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchIcon:        { fontSize: 14, color: C.textFaint },
  searchInput:       { flex: 1, color: C.text, fontSize: 14 },

  // Section headers (ESPN-style label with accent bar)
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10 },
  sectionAccentBar:  { width: 3, height: 16, backgroundColor: C.accent, borderRadius: 2 },
  sectionTitle:      { color: C.text, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Trending
  trendingWrap:      { marginBottom: 4 },
  trendingScroll:    { paddingHorizontal: 14, gap: 10, paddingBottom: 4 },
  trendingCard:      { width: 190, backgroundColor: C.surface, borderRadius: R.xl, padding: 14, borderWidth: 1, borderColor: C.border, gap: 8, justifyContent: 'space-between' },
  trendingRankBadge: { alignSelf: 'flex-start', backgroundColor: C.accentDim, borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  trendingRankText:  { color: C.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  trendingTitle:     { color: C.text, fontSize: 13, fontWeight: '800', lineHeight: 18, flex: 1 },
  trendingFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendingMeta:      { color: C.textFaint, fontSize: 10, flex: 1 },
  trendingViews:     { color: C.textFaint, fontSize: 10 },

  // Filter chips
  filtersBar:        { marginBottom: 4 },
  filtersScroll:     { paddingHorizontal: 14, gap: 8, paddingBottom: 10 },
  filterChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  filterChipActive:  { backgroundColor: C.accent, borderColor: C.accent },
  filterText:        { color: C.textMuted, fontSize: 13, fontWeight: '700' },
  filterTextActive:  { color: '#fff' },

  // Post card
  card:              { backgroundColor: C.surface, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardDivider:       { height: 1, backgroundColor: C.border, marginVertical: 2 },
  creatorRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorName:       { color: C.text, fontSize: 13, fontWeight: '800' },
  creatorHandle:     { color: C.textMuted, fontSize: 11 },
  verifiedBadge:     { backgroundColor: C.accentDim, borderRadius: R.sm, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  verifiedText:      { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  tagsRow:           { flexDirection: 'row', gap: 6 },
  tagChip:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full, backgroundColor: C.surface3 },
  tagChipFirst:      { backgroundColor: C.accentDim, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  tagText:           { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  tagTextFirst:      { color: C.accent },
  cardTitle:         { color: C.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.3, lineHeight: 22 },
  cardPreview:       { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  cardFooter:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText:          { color: C.textFaint, fontSize: 11, fontWeight: '500' },
});
