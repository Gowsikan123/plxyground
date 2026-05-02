import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFeedStore } from '../../store/feedStore';
import SkeletonCard from '../../components/SkeletonCard';

const SKELETON_COUNT = 5;

export default function FeedScreen() {
  const { posts, loading, refreshing, fetchFeed, refreshFeed } = useFeedStore();

  useEffect(() => {
    fetchFeed();
  }, []);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.username}>@{item.username || 'creator'}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      {item.title && <Text style={styles.title}>{item.title}</Text>}
      {item.body && <Text style={styles.body} numberOfLines={3}>{item.body}</Text>}
      <View style={styles.footer}>
        <Text style={styles.tag}>#{item.category || 'content'}</Text>
      </View>
    </View>
  ), []);

  if (loading && !posts.length) {
    return (
      <View style={styles.container}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
      </View>
    );
  }

  if (!loading && !posts.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>📌 Nothing here yet</Text>
        <Text style={styles.emptySubtext}>Content from creators you follow will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshFeed} tintColor="#7c3aed" />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  card: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#1e1e1e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  username: { color: '#7c3aed', fontSize: 13, fontWeight: '700' },
  date: { color: '#555', fontSize: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  body: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  footer: { marginTop: 10, flexDirection: 'row' },
  tag: { color: '#555', fontSize: 12 },
  empty: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#fff', fontSize: 20, marginBottom: 8 },
  emptySubtext: { color: '#666', fontSize: 14, textAlign: 'center' },
});
