import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../services/api';
import { debounce } from '../../utils/debounce';

export default function SearchCreatorsScreen() {
  const [creators, setCreators] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(q = '') {
    try {
      const data = await api.get(`/creators?search=${encodeURIComponent(q)}`);
      setCreators(data.data || []);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const debouncedLoad = useCallback(debounce(load, 400), []);

  useEffect(() => { load(); }, []);
  useEffect(() => { debouncedLoad(search); }, [search]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Find Creators</Text>
      <TextInput style={styles.search} value={search} onChangeText={setSearch}
        placeholder="Search by name or niche..." placeholderTextColor="#555" />
      <FlatList
        data={creators}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search); }} tintColor="#7c3aed" />}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No creators found</Text></View>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase() || '?'}</Text></View>
            <View style={styles.info}>
              <Text style={styles.username}>@{item.username}</Text>
              {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16, paddingTop: 24 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  search: { backgroundColor: '#111', color: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e1e1e', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2d1b6b', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#c4b5fd', fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  username: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bio: { color: '#888', fontSize: 13, marginTop: 2 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
});
