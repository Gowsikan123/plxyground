import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../components/BottomNav';
import { C, R, GRAD_ACCENT } from '../components/theme';

export default function Opportunities() {
  const [opps, setOpps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const load = async () => {
    try {
      const data = await apiRequest('/api/opportunities?limit=50');
      setOpps(data.data || []);
      setError('');
    } catch {
      setError('Failed to load opportunities. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const renderOpp = ({ item }) => (
    <TouchableOpacity style={s.card} activeOpacity={0.88}>
      <View style={s.cardTop}>
        <View style={s.orgAvatar}>
          <Text style={s.orgAvatarText}>{item.creator_name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={s.cardMeta}>
          <Text style={s.orgName}>{item.creator_name}</Text>
          <Text style={s.postedDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>Live</Text>
        </View>
      </View>

      <Text style={s.title}>{item.title}</Text>
      {item.role_type ? (
        <View style={s.roleWrap}>
          <Text style={s.roleText}>{item.role_type}</Text>
        </View>
      ) : null}
      <Text style={s.body} numberOfLines={3}>{item.body}</Text>

      <TouchableOpacity style={s.applyWrap} activeOpacity={0.85}>
        <LinearGradient colors={GRAD_ACCENT} style={s.applyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.applyText}>Apply Now →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Opportunities</Text>
          <Text style={s.headerSub}>Brand deals & collabs for creators</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>{opps.length}</Text>
        </View>
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={opps}
          keyExtractor={i => String(i.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎯</Text>
              <Text style={s.emptyTitle}>No opportunities yet</Text>
              <Text style={s.emptySub}>Brands will post deals here. Check back soon.</Text>
            </View>
          }
          renderItem={renderOpp}
        />
      )}

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerTitle:  { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerSub:    { color: C.textMuted, fontSize: 13, marginTop: 3 },
  countBadge:   { backgroundColor: C.accentDark, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  countText:    { color: C.accent, fontSize: 15, fontWeight: '800' },
  errorBox:     { backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#7F1D1D', padding: 12, marginHorizontal: 16, borderRadius: R.md, marginBottom: 8 },
  errorText:    { color: C.red, fontSize: 13 },
  list:         { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:    { fontSize: 52 },
  emptyTitle:   { color: C.text, fontSize: 20, fontWeight: '800' },
  emptySub:     { color: C.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  // Card
  card:         { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 14, padding: 18, borderWidth: 1, borderColor: C.border },
  cardTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  orgAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentDark, alignItems: 'center', justifyContent: 'center' },
  orgAvatarText:{ color: C.accent, fontSize: 18, fontWeight: '900' },
  cardMeta:     { flex: 1 },
  orgName:      { color: C.text, fontSize: 15, fontWeight: '700' },
  postedDate:   { color: C.textMuted, fontSize: 12, marginTop: 2 },
  liveBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.greenGlow, borderWidth: 1, borderColor: C.greenDark, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText:     { color: C.green, fontSize: 11, fontWeight: '700' },
  title:        { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 10, lineHeight: 26, letterSpacing: -0.2 },
  roleWrap:     { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full, marginBottom: 10 },
  roleText:     { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  body:         { color: C.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  applyWrap:    { borderRadius: R.md, overflow: 'hidden' },
  applyBtn:     { paddingVertical: 14, alignItems: 'center', borderRadius: R.md },
  applyText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});
