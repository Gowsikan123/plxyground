import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '../../components/ContentCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { ENDPOINTS } from '../../constants/api';

export default function Feed() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    if (!hasMore && !reset) return;
    const p = reset ? 1 : page;
    const { data } = await api.get(ENDPOINTS.CONTENT, { page: p, limit: 20 });
    if (data) {
      const items = data.content || data;
      setPosts((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(items.length === 20);
      if (!reset) setPage(p + 1);
    }
  }, [page, hasMore]);

  useEffect(() => { load(true).finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await load(true);
    setRefreshing(false);
  };

  if (loading) return (
    <View style={[styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.brand}>PLXY<Text style={styles.brandAccent}>GROUND</Text></Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ContentCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        onEndReached={() => load()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState icon="📭" title="No posts yet" message="Check back later for content from athletes." />}
        ListFooterComponent={hasMore && posts.length > 0 ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  brand: { color: Colors.text, fontSize: 22, fontFamily: 'Syne_700Bold' },
  brandAccent: { color: Colors.primary },
  list: { padding: 12 },
});
