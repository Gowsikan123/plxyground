import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export default function BusinessDashboardScreen() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get('/business/content', token);
        setStats({ totalPosts: data.total || 0, posts: data.data || [] });
      } catch {
        setStats({ totalPosts: 0, posts: [] });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome back,</Text>
      <Text style={styles.company}>{user?.company_name || 'Your Business'}</Text>

      <View style={styles.kpiRow}>
        <View style={styles.kpi}>
          <Text style={styles.kpiValue}>{stats?.totalPosts ?? 0}</Text>
          <Text style={styles.kpiLabel}>Total Posts</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValue}>🟢</Text>
          <Text style={styles.kpiLabel}>Account Active</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Campaigns</Text>
      {stats?.posts?.slice(0, 5).map((post) => (
        <View key={post.id} style={styles.card}>
          <Text style={styles.cardTitle}>{post.title}</Text>
          <Text style={styles.cardStatus}>{post.status}</Text>
        </View>
      ))}

      {!stats?.posts?.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No campaigns yet.</Text>
          <Text style={styles.emptySubtext}>Create your first post from the Content tab.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 32 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  greeting: { color: '#888', fontSize: 14 },
  company: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  kpi: { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1e1e1e', alignItems: 'center' },
  kpiValue: { color: '#7c3aed', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  kpiLabel: { color: '#888', fontSize: 13 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#111', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1e1e1e' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardStatus: { color: '#888', fontSize: 12, marginTop: 4 },
  empty: { paddingTop: 32, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16 },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
});
