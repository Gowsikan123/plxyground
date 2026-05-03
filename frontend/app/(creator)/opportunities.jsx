import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '../../utils/haptics';
import { C, R } from '../../components/theme';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';

const FILTERS = ['All', 'Sponsorship', 'Collab', 'Affiliate', 'Event'];

function DealCard({ item, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      {/* Brand + badge row */}
      <View style={s.cardTop}>
        <View style={s.brandBadge}>
          <Text style={s.brandInitial}>{(item.business_name || 'B')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.brandName}>{item.business_name || 'Brand'}</Text>
          <Text style={s.dealType}>{item.deal_type || 'Opportunity'}</Text>
        </View>
        <View style={[s.statusBadge, item.status === 'open' && s.statusOpen]}>
          <Text style={[s.statusText, item.status === 'open' && s.statusTextOpen]}>
            {item.status === 'open' ? 'OPEN' : (item.status || 'CLOSED').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.cardDivider} />

      {/* Title */}
      <Text style={s.cardTitle}>{item.title}</Text>

      {/* Description preview */}
      {item.description ? (
        <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {/* Meta row */}
      <View style={s.metaRow}>
        {item.budget ? (
          <View style={s.budgetBadge}>
            <Text style={s.budgetText}>💰 {item.budget}</Text>
          </View>
        ) : null}
        {item.deadline ? (
          <Text style={s.deadlineMeta}>⏱ {new Date(item.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
        ) : null}
        {item.sport ? (
          <Text style={s.sportMeta}>⚽ {item.sport}</Text>
        ) : null}
      </View>

      {/* Apply CTA */}
      {item.status === 'open' && (
        <TouchableOpacity style={s.applyBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={s.applyBtnText}>View &amp; Apply  →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function Opportunities() {
  const router = useRouter();
  const [deals, setDeals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setR]      = useState(false);
  const [filter, setFilter]     = useState('All');

  const fetchDeals = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.set('type', filter.toLowerCase());
      const data = await apiRequest(`/api/opportunities?${params}`);
      setDeals(data.data || data || []);
    } catch (_) {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  const onRefresh = async () => { setR(true); await fetchDeals(true); setR(false); };

  const ListHeader = (
    <View>
      {/* Section header */}
      <View style={s.sectionHeader}>
        <View style={s.sectionAccentBar} />
        <Text style={s.sectionTitle}>BRAND DEALS</Text>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersScroll}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        )}
        style={{ marginBottom: 8 }}
      />
    </View>
  );

  return (
    <View style={s.page}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Deals <Text style={s.headerAccent}>& Opportunities</Text></Text>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={i => String(i)}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ padding: 14, gap: 12 }}
        />
      ) : (
        <FlatList
          data={deals}
          keyExtractor={d => String(d.id)}
          renderItem={({ item }) => (
            <DealCard
              item={item}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/opportunity/${item.id}`); }}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState title="No deals yet" message="Check back soon — brands are posting opportunities." />
          }
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: C.bg },
  header:            { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12 },
  headerTitle:       { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  headerAccent:      { color: C.accent },

  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 0, paddingTop: 4, paddingBottom: 10 },
  sectionAccentBar:  { width: 3, height: 16, backgroundColor: C.accent, borderRadius: 2 },
  sectionTitle:      { color: C.text, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

  filtersScroll:     { gap: 8, paddingBottom: 4 },
  filterChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  filterChipActive:  { backgroundColor: C.accent, borderColor: C.accent },
  filterText:        { color: C.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextActive:  { color: '#fff' },

  card:              { backgroundColor: C.surface, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardTop:           { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardDivider:       { height: 1, backgroundColor: C.border },
  brandBadge:        { width: 42, height: 42, borderRadius: R.md, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  brandInitial:      { color: C.accent, fontSize: 18, fontWeight: '900' },
  brandName:         { color: C.text, fontSize: 14, fontWeight: '800' },
  dealType:          { color: C.textFaint, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge:       { paddingHorizontal: 9, paddingVertical: 4, borderRadius: R.full, backgroundColor: C.surface3, borderWidth: 1, borderColor: C.border },
  statusOpen:        { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.25)' },
  statusText:        { color: C.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusTextOpen:    { color: C.success },
  cardTitle:         { color: C.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.2, lineHeight: 21 },
  cardDesc:          { color: C.textMuted, fontSize: 13, lineHeight: 19 },
  metaRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  budgetBadge:       { backgroundColor: C.successDark, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 },
  budgetText:        { color: C.success, fontSize: 12, fontWeight: '800' },
  deadlineMeta:      { color: C.textFaint, fontSize: 12 },
  sportMeta:         { color: C.textFaint, fontSize: 12 },
  applyBtn:          { backgroundColor: C.accent, borderRadius: R.lg, paddingVertical: 11, alignItems: 'center', marginTop: 2 },
  applyBtnText:      { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
});
