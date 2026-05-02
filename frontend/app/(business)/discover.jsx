import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { creatorService } from '../../services/creatorService';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Header from '../../components/layout/Header';

function CreatorRow({ creator }) {
  return (
    <Pressable style={styles.creatorRow} onPress={() => router.push(`/creator/${creator.slug || creator.id}`)}>      
      <Avatar uri={creator.avatar_url} name={creator.display_name || creator.username} size={48} />
      <View style={styles.creatorInfo}>
        <Text style={styles.creatorName}>{creator.display_name || creator.username}</Text>
        <Text style={styles.creatorHandle}>@{creator.username}</Text>
        {creator.sports_niche && <Badge label={creator.sports_niche} color={COLORS.primary} small />}
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const [creators, setCreators] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCreators = useCallback(async (reset = false) => {
    if (reset) { setPage(1); setHasMore(true); }
    const p = reset ? 1 : page;
    const { data, error } = await creatorService.list({ page: p, limit: 20, search: query });
    if (!error && data) {
      setCreators((prev) => reset ? data.creators : [...prev, ...data.creators]);
      setHasMore(data.creators.length === 20);
      if (!reset) setPage(p + 1);
    }
    setLoading(false);
    setRefreshing(false);
  }, [query, page]);

  useEffect(() => { setLoading(true); fetchCreators(true); }, [query]);

  const refresh = () => { setRefreshing(true); fetchCreators(true); };

  return (
    <View style={styles.container}>
      <Header title="Discover Creators" />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search creators or sport..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[10] }} />
      ) : (
        <FlatList
          data={creators}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CreatorRow creator={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
          onEndReached={() => hasMore && fetchCreators()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No creators found" message="Try a different search term" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: { backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], ...TYPOGRAPHY.bodyMd, color: COLORS.text },
  list: { padding: SPACING[4] },
  creatorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING[3], gap: SPACING[3], borderBottomWidth: 1, borderBottomColor: COLORS.border },
  creatorInfo: { flex: 1, gap: SPACING[1] },
  creatorName: { ...TYPOGRAPHY.labelLg, color: COLORS.text },
  creatorHandle: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  arrow: { ...TYPOGRAPHY.headingMd, color: COLORS.textMuted },
});
