import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, R } from '../../components/theme';
import { Header } from '../../components/layout/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { apiRequest } from '../../components/ApiClient';
import { useToastStore } from '../../components/ui/Toast';

const SPORT_FILTERS = ['All', 'Football', 'Basketball', 'Fitness', 'Nutrition', 'Running'];

function formatBudget(opp) {
  if (opp.budget_min && opp.budget_max) return `£${opp.budget_min}–£${opp.budget_max}`;
  if (opp.budget)  return `£${opp.budget}`;
  if (opp.value)   return `£${opp.value}`;
  return null;
}

export default function Opportunities() {
  const showToast              = useToastStore(s => s.show);
  const [opps, setOpps]        = useState([]);
  const [loading, setLoading]  = useState(true);
  const [filter, setFilter]    = useState('All');
  const [applied, setApplied]  = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/api/opportunities');
        setOpps(data.data || data || []);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const handleApply = async (opp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiRequest(`/api/opportunities/${opp.id}/apply`, { method: 'POST' });
    } catch (_) {}
    setApplied(prev => ({ ...prev, [opp.id]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
    showToast('Application sent!', 'success');
  };

  const filtered = filter === 'All'
    ? opps
    : opps.filter(o =>
        o.sport?.toLowerCase()    === filter.toLowerCase() ||
        o.category?.toLowerCase() === filter.toLowerCase()
      );

  return (
    <View style={s.page}>
      <Header title="Opportunities" />

      {/* Sport filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll} style={s.filtersBar}>
        {SPORT_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <FlatList data={[1,2,3]} keyExtractor={i => String(i)} renderItem={() => <SkeletonCard />} contentContainerStyle={{ padding: 16, gap: 12 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState title="No opportunities" message="Check back soon for new deals." />
          }
          renderItem={({ item: opp }) => {
            const isApplied = !!applied[opp.id];
            const budget    = formatBudget(opp);
            return (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.cardTitle}>{opp.title}</Text>
                    <Text style={s.cardBusiness}>{opp.business_name || opp.company || 'Brand Partner'}</Text>
                  </View>
                  {budget && (
                    <View style={s.budgetPill}>
                      <Text style={s.budgetText}>{budget}</Text>
                    </View>
                  )}
                </View>

                {opp.description ? (
                  <Text style={s.cardDesc} numberOfLines={3}>{opp.description}</Text>
                ) : null}

                <View style={s.cardFooter}>
                  {opp.sport && (
                    <View style={s.sportChip}>
                      <Text style={s.sportText}>{opp.sport}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.applyBtn, isApplied && s.applyBtnDone]}
                    onPress={() => !isApplied && handleApply(opp)}
                    activeOpacity={isApplied ? 1 : 0.8}
                  >
                    <Text style={[s.applyText, isApplied && s.applyTextDone]}>
                      {isApplied ? `Applied ✓  ${applied[opp.id]}` : 'Apply Now →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page:           { flex: 1, backgroundColor: C.bg },
  filtersBar:     { maxHeight: 52 },
  filtersScroll:  { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.full, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  chipActive:     { backgroundColor: C.accent, borderColor: C.accent },
  chipText:       { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  card:           { backgroundColor: C.surface, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle:      { color: C.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  cardBusiness:   { color: C.textMuted, fontSize: 12 },
  cardDesc:       { color: C.textMuted, fontSize: 13, lineHeight: 19 },
  budgetPill:     { backgroundColor: C.successDark, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  budgetText:     { color: C.success, fontSize: 12, fontWeight: '800' },
  cardFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  sportChip:      { backgroundColor: C.surface3, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 },
  sportText:      { color: C.textFaint, fontSize: 11, fontWeight: '700' },
  applyBtn:       { backgroundColor: C.accent, borderRadius: R.lg, paddingHorizontal: 18, paddingVertical: 10 },
  applyBtnDone:   { backgroundColor: C.successDark, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  applyText:      { color: '#fff', fontSize: 13, fontWeight: '800' },
  applyTextDone:  { color: C.success },
});
