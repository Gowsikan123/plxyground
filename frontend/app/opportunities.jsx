import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, SafeAreaView, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../components/BottomNav';
import SkeletonCard from '../components/SkeletonCard';
import { C, R, GRAD_HERO, GRAD_LIME } from '../components/theme';

const ROLE_COLORS = {
  'Athlete':    { bg: 'rgba(255,77,109,0.12)',  text: C.accent  },
  'Creator':    { bg: 'rgba(191,95,255,0.12)',  text: C.purple  },
  'Journalist': { bg: 'rgba(0,212,255,0.12)',   text: C.cyan    },
  'Coach':      { bg: 'rgba(170,255,0,0.12)',   text: C.lime    },
};

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
      setError('Failed to load. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const renderOpp = ({ item }) => {
    const roleStyle = ROLE_COLORS[item.role_type] || { bg: C.surface3, text: C.textMuted };
    return (
      <View style={s.card}>
        {/* Card top accent bar */}
        <LinearGradient colors={GRAD_HERO} style={s.cardAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

        <View style={s.cardInner}>
          {/* Org row */}
          <View style={s.orgRow}>
            <LinearGradient colors={GRAD_HERO} style={s.orgAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.orgAvatarText}>{item.creator_name?.[0]?.toUpperCase()}</Text>
            </LinearGradient>
            <View style={s.orgMeta}>
              <Text style={s.orgName}>{item.creator_name}</Text>
              <Text style={s.orgDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
            </View>
            <View style={s.livePill}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={s.title}>{item.title}</Text>

          {/* Tags row */}
          <View style={s.tagsRow}>
            {item.role_type && (
              <View style={[s.tag, { backgroundColor: roleStyle.bg }]}>
                <Text style={[s.tagText, { color: roleStyle.text }]}>{item.role_type}</Text>
              </View>
            )}
            {item.benefits && (
              <View style={s.tagBenefit}>
                <Text style={s.tagBenefitText}>💰 Paid</Text>
              </View>
            )}
          </View>

          {/* Body */}
          <Text style={s.body} numberOfLines={3}>{item.body}</Text>

          {/* Apply CTA */}
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient colors={GRAD_LIME} style={s.applyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.applyText}>Apply Now  →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Opportunities</Text>
          <Text style={s.headerSub}>Brand deals & collabs for creators</Text>
        </View>
        <View style={s.countCircle}>
          <Text style={s.countText}>{opps.length}</Text>
          <Text style={s.countLabel}>live</Text>
        </View>
      </View>

      {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View> : null}

      {loading ? (
        <View style={s.list}><SkeletonCard /><SkeletonCard /></View>
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
              <Text style={s.emptyTitle}>No deals yet</Text>
              <Text style={s.emptySub}>Brands will post opportunities here. Check back soon.</Text>
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
  safe:           { flex: 1, backgroundColor: C.bg },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerTitle:    { color: C.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSub:      { color: C.textMuted, fontSize: 12, marginTop: 3 },
  countCircle:    { width: 52, height: 52, borderRadius: 26, backgroundColor: C.accentDark, borderWidth: 1, borderColor: 'rgba(255,77,109,0.3)', alignItems: 'center', justifyContent: 'center' },
  countText:      { color: C.accent, fontSize: 16, fontWeight: '900', lineHeight: 18 },
  countLabel:     { color: C.accent, fontSize: 9, fontWeight: '700', opacity: 0.7 },
  errorBox:       { backgroundColor: C.redDark, borderWidth: 1, borderColor: 'rgba(255,68,68,0.25)', padding: 12, marginHorizontal: 16, borderRadius: R.md, marginBottom: 8 },
  errorText:      { color: C.red, fontSize: 13 },
  list:           { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  empty:          { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:      { fontSize: 52 },
  emptyTitle:     { color: C.text, fontSize: 20, fontWeight: '800' },
  emptySub:       { color: C.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  card:           { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cardAccentBar:  { height: 4 },
  cardInner:      { padding: 18 },
  orgRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  orgAvatar:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  orgAvatarText:  { color: '#fff', fontSize: 18, fontWeight: '900' },
  orgMeta:        { flex: 1 },
  orgName:        { color: C.text, fontSize: 15, fontWeight: '700' },
  orgDate:        { color: C.textMuted, fontSize: 12, marginTop: 2 },
  livePill:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.greenDark, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full },
  liveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText:       { color: C.green, fontSize: 11, fontWeight: '700' },
  title:          { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 12, lineHeight: 26, letterSpacing: -0.3 },
  tagsRow:        { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  tag:            { paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full },
  tagText:        { fontSize: 12, fontWeight: '700' },
  tagBenefit:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.full, backgroundColor: 'rgba(255,215,0,0.10)' },
  tagBenefitText: { color: C.gold, fontSize: 12, fontWeight: '700' },
  body:           { color: C.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  applyBtn:       { paddingVertical: 15, alignItems: 'center', borderRadius: R.lg },
  applyText:      { color: '#0A0A0F', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
});
