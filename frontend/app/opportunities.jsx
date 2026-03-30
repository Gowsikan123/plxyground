import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function Opportunities() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await apiRequest('/api/opportunities?limit=50');
      setOpportunities(data.data || []);
      setError('');
    } catch (e) {
      setError('Failed to load opportunities. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const renderOpportunity = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.brandChip}>
          <Text style={styles.brandChipText}>{item.creator_name}</Text>
        </View>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.roleType}>{item.role_type || 'Partnership'}</Text>
      <Text style={styles.cardBody}>{item.body}</Text>

      {item.requirements ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Requirements</Text>
          <Text style={styles.blockText}>{item.requirements}</Text>
        </View>
      ) : null}

      {item.benefits ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Benefits</Text>
          <Text style={styles.blockText}>{item.benefits}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.interestBtn} activeOpacity={0.85}>
        <Text style={styles.interestBtnText}>Express Interest</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <Text style={styles.title}>Opportunities</Text>
        <TouchableOpacity style={styles.feedBtn} onPress={() => router.push('/feed')}>
          <Text style={styles.feedBtnText}>Back to Feed</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={['#0d1e38', '#080C14']} style={styles.hero}>
        <Text style={styles.heroTitle}>Find brand work worth saying yes to</Text>
        <Text style={styles.heroSub}>Browse live opportunities from businesses looking for sports creators, ambassadors, and campaign partners.</Text>
      </LinearGradient>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        </View>
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOpportunity}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No live opportunities yet</Text>
              <Text style={styles.emptySub}>When businesses publish briefs, they will show up here for creators to review.</Text>
            </View>
          )}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/feed')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/opportunities')}>
          <Text style={styles.navIcon}>🤝</Text>
          <Text style={[styles.navLabel, { color: '#3b82f6' }]}>Opps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/create')}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.navCreateBtn}>
            <Text style={styles.navCreateIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  feedBtn: { backgroundColor: '#0f1623', borderWidth: 1, borderColor: '#1e293b', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  feedBtnText: { color: '#60a5fa', fontSize: 12, fontWeight: '700' },
  hero: { marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 14 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8, lineHeight: 30 },
  heroSub: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  errorBox: { backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#7f1d1d', padding: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  errorText: { color: '#f87171', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#334155', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptySub: { color: '#475569', fontSize: 14, textAlign: 'center', paddingHorizontal: 28 },
  card: { backgroundColor: '#0f1623', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1a2035' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandChip: { backgroundColor: '#1a2420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  brandChipText: { color: '#34d399', fontSize: 11, fontWeight: '800' },
  cardDate: { color: '#475569', fontSize: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 25 },
  roleType: { color: '#60a5fa', fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  cardBody: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  block: { marginTop: 14 },
  blockLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 5 },
  blockText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  interestBtn: { backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  interestBtnText: { color: '#60a5fa', fontWeight: '800', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 22 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
