import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await apiRequest('/api/business/content/mine', 'GET', null, token);
      setPosts(data.data || []);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Content</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/business/create-post')}>
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyTitle}>No content yet</Text>
              <Text style={styles.emptySub}>Create your first business post</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/business/create-post')}>
                <Text style={styles.emptyBtnText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/post/${item.id}`)} activeOpacity={0.85}>
              <Image source={{ uri: item.media_url }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: item.is_published ? '#1a2420' : '#1a1a2e' }]}>
                    <Text style={[styles.statusText, { color: item.is_published ? '#34d399' : '#a78bfa' }]}>
                      {item.is_published ? '✓ Published' : '⏳ Pending'}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardType}>{item.content_type}</Text>
                {item.campaign_goal ? <Text style={styles.cardMeta}>Goal: {item.campaign_goal}</Text> : null}
                {item.call_to_action ? <Text style={styles.cardMeta}>CTA: {item.call_to_action}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/search-creators')}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/create-post')}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.navCreateBtn}>
            <Text style={styles.navCreateIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/profile')}>
          <Text style={styles.navIcon}>🏢</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  backText: { color: '#3b82f6', fontSize: 18 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  createBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptySub: { color: '#475569', fontSize: 14 },
  emptyBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#60a5fa', fontWeight: '700' },
  card: { backgroundColor: '#0f1623', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2035' },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDate: { color: '#334155', fontSize: 12 },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 15, lineHeight: 22, marginBottom: 6 },
  cardType: { color: '#475569', fontSize: 12 },
  cardMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
