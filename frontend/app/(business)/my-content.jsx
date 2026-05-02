import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export default function MyContentScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuthStore();

  async function load() {
    try {
      const data = await api.get('/business/content', token);
      setPosts(data.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
      ListHeaderComponent={<Text style={styles.heading}>My Content</Text>}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>📝 No content yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.status, item.status === 'approved' && styles.statusApproved]}>{item.status}</Text>
          </View>
          {item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', paddingTop: 24, marginBottom: 12 },
  card: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1e1e1e' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  status: { color: '#f59e0b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  statusApproved: { color: '#10b981' },
  body: { color: '#aaa', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  date: { color: '#555', fontSize: 12 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
});
