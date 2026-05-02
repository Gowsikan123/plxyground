import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function OpportunitiesScreen() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore((s) => s.token);

  async function load() {
    try {
      const data = await api.get('/opportunities');
      setOpps(data.data || []);
    } catch (err) {
      console.error('Failed to load opportunities', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  return (
    <FlatList
      data={opps}
      keyExtractor={(item) => String(item.id)}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>💼 No opportunities yet</Text>
          <Text style={styles.emptySubtext}>Check back soon for brand deals and sponsorships.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.company}>{item.company_name || 'Partner'}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {item.description && <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>}
          <View style={styles.row}>
            {item.budget_range && <Text style={styles.budget}>💰 {item.budget_range}</Text>}
            {item.category && <Text style={styles.tag}>#{item.category}</Text>}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#1e1e1e' },
  company: { color: '#7c3aed', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  desc: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  budget: { color: '#6ee7b7', fontSize: 13, fontWeight: '600' },
  tag: { color: '#555', fontSize: 13 },
  empty: { flex: 1, paddingTop: 80, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: '#fff', fontSize: 18, marginBottom: 8 },
  emptySubtext: { color: '#666', fontSize: 14, textAlign: 'center' },
});
