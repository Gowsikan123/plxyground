import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, RefreshControl, TextInput, Animated,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { C, R } from '../../components/theme';
import { Avatar } from '../../components/ui/Avatar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiRequest } from '../../components/ApiClient';
import { useAuthStore } from '../../store/authStore';
import { useSavedStore } from '../../store/savedStore';

const FILTERS = ['All', 'Football', 'Basketball', 'Fitness', 'Nutrition', 'Mindset'];

function TrendingRow({ posts, onPress }) {
  if (!posts.length) return null;
  return (
    <View style={s.trendingWrap}>
      <Text style={s.trendingLabel}>🔥 Trending this week</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trendingScroll}>
        {posts.map((p, i) => (
          <TouchableOpacity key={p.id} style={s.trendingCard} onPress={() => onPress(p)} activeOpacity={0.8}>
            <View style={s.trendingRank}><Text style={s.trendingRankText}>#{i + 1}</Text></View>
            <Text style={s.trendingTitle} numberOfLines={2}>{p.title}</Text>
            <Text style={s.trendingMeta}>{p.display_name} · {p.view_count || 0} views</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function PostCard({ post, saved, onSave, onPress, onCreatorPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  const wordCount = post.body ? post.body.trim().split(/\s+/).length : 0;
  const readMins  = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={s.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Creator row — tappable to profile */}
        <TouchableOpacity style={s.creatorRow} onPress={onCreatorPress} activeOpacity={0.7}>
          <Avatar uri={post.avatar_url} name={post.display_name} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={s.creatorName}>{post.display_name}</Text>
            <Text style={s.creatorHandle}>@{post.username}</Text>
          </View>
          {post.is_verified ? <Text style={s.verifiedBadge}>✓</Text> : null}
        </TouchableOpacity>

        {/* Title & preview */}
        <Text style={s.cardTitle}>{post.title}</Text>
        {post.body ? (
          <Text style={s.cardPreview} numberOfLines={3}>{post.body}</Text>
        ) : null}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <View style={s.tagsRow}>
            {post.tags.slice(0, 4).map(t => (
              <View key={t} style={s.tagChip}>
                <Text style={s.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer: meta + bookmark */}
        <View style={s.cardFooter}>
          <Text style={s.metaText}>
            {post.view_count || 0} views
            {wordCount > 0 ? ` · ~${readMins} min read` : ` · ${new Date(post.created_at).toLocaleDateString()}`}
          </Text>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSave(post); }}
            style={s.bookmarkBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 18, color: saved ? C.accent : C.textFaint }}>{saved ? '🔖' : '🔲'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Feed() {
  const router  = useRouter();
  const [posts, setPosts]         = useState([]);
  const [trending, setTrending]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const { toggle, isSaved }       = useSavedStore();

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
      setTrending(sorted.slice(0, 3));
    } catch (_) {}
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(true); setRefreshing(false); };

  const ListHeader = (
    <View>
      <TrendingRow
        posts={trending}
        onPress={p => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${p.id}`); }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll} style={s.filtersBar}>
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
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>PLXYGROUND</Text>
        <TouchableOpacity onPress={() => router.push('/saved')} style={s.iconBtn}>
          <Text style={{ fontSize: 20 }}>🔖</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Search posts…"
          placeholderTextColor={C.textFaint}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => fetchPosts()}
        />
      </View>

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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page:             { flex: 1, backgroundColor: C.bg },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  logo:             { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  iconBtn:          { padding: 6 },
  searchWrap:       { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput:      { backgroundColor: C.surface, borderRadius: R.lg, paddingHorizontal: 16, paddingVertical: 10, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  filtersBar:       { marginBottom: 4 },
  filtersScroll:    { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterText:       { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  trendingWrap:     { paddingTop: 8, paddingBottom: 4 },
  trendingLabel:    { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase' },
  trendingScroll:   { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  trendingCard:     { width: 180, backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.border, gap: 6 },
  trendingRank:     { alignSelf: 'flex-start', backgroundColor: C.accentDim, borderRadius: R.sm, paddingHorizontal: 7, paddingVertical: 2 },
  trendingRankText: { color: C.accent, fontSize: 11, fontWeight: '800' },
  trendingTitle:    { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  trendingMeta:     { color: C.textFaint, fontSize: 11 },
  card:             { backgroundColor: C.surface, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  creatorRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorName:      { color: C.text, fontSize: 14, fontWeight: '700' },
  creatorHandle:    { color: C.textMuted, fontSize: 12 },
  verifiedBadge:    { color: C.accent, fontSize: 13, fontWeight: '800' },
  cardTitle:        { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, lineHeight: 22 },
  cardPreview:      { color: C.textMuted, fontSize: 14, lineHeight: 20 },
  tagsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip:          { backgroundColor: C.surface3, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 3 },
  tagText:          { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  cardFooter:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  metaText:         { color: C.textFaint, fontSize: 12 },
  bookmarkBtn:      { padding: 4 },
});
