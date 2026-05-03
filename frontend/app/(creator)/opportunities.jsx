import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { useApplyStore } from '../../store/applyStore';
import { C, R, GRAD_ACCENT } from '../../components/theme';

const DEMO_OPPS = [
  { id: 'o1', title: 'Social Media Ambassador', business_name: 'Nike Sport UK',    budget: '£500–£1,000',  category: 'Apparel',   deadline: '2026-06-01', description: 'Looking for UK-based athletes with 5k+ followers for a summer kit campaign.' },
  { id: 'o2', title: 'YouTube Collaboration',   business_name: 'Myprotein',         budget: '£200 + product', category: 'Nutrition', deadline: '2026-05-20', description: 'Review our new recovery range in a training video. Full product supply included.' },
  { id: 'o3', title: 'Event Appearance',        business_name: 'Adidas Grassroots', budget: '£300/day',     category: 'Footwear',  deadline: '2026-07-15', description: 'Seeking youth athletes to appear at our regional community events this summer.' },
  { id: 'o4', title: 'Podcast Guest Spot',      business_name: 'The Sports Desk',   budget: 'Revenue share', category: 'Media',    deadline: '2026-05-30', description: 'Share your story on our weekly show. Ideal for athletes with an inspiring journey.' },
  { id: 'o5', title: 'Fitness App Promotion',   business_name: 'Hyrox UK',          budget: '£150 + access', category: 'Fitness',  deadline: '2026-06-10', description: 'Promote our app to your community. Free premium access included for you and followers.' },
];

const CATEGORIES = ['All', 'Apparel', 'Nutrition', 'Footwear', 'Media', 'Fitness'];

export default function Opportunities() {
  const [items, setItems]       = useState([]);
  const [filter, setFilter]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [toast, setToast]       = useState({ visible: false, message: '', type: 'success' });

  const apply      = useApplyStore((s) => s.apply);
  const hasApplied = useApplyStore((s) => s.hasApplied);
  const appliedAt  = useApplyStore((s) => s.appliedAt);

  const load = async () => {
    try {
      const data = await apiRequest('/api/opportunities?limit=30');
      const live = data?.data || data?.items || [];
      setItems(live.length > 0 ? live : DEMO_OPPS);
    } catch {
      setItems(DEMO_OPPS);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayed = filter === 'All' ? items : items.filter(i => i.category === filter);

  const handleApply = (item) => {
    if (hasApplied(item.id)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    apply(item.id);
    setToast({ visible: true, message: `Applied to "${item.title}" ✓`, type: 'success' });
  };

  const renderItem = ({ item }) => {
    const applied   = hasApplied(item.id);
    const appliedTs = appliedAt(item.id);
    const appliedDate = appliedTs ? new Date(appliedTs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null;

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.tagRow}>
            {item.category && (
              <View style={s.catPill}>
                <Text style={s.catText}>{item.category}</Text>
              </View>
            )}
            {item.deadline && (
              <Text style={s.deadline}>Closes {new Date(item.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
            )}
          </View>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={s.bizName}>{item.business_name}</Text>
        </View>
        {item.description ? <Text style={s.desc} numberOfLines={3}>{item.description}</Text> : null}
        <View style={s.cardFooter}>
          {item.budget ? <Text style={s.budget}>{item.budget}</Text> : null}
          {applied ? (
            <View style={s.appliedPill}>
              <Text style={s.appliedText}>Applied ✓{appliedDate ? `  ${appliedDate}` : ''}</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.applyBtn} onPress={() => handleApply(item)} activeOpacity={0.85}>
              <Text style={s.applyText}>Apply →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />

      <View style={s.header}>
        <Text style={s.heading}>Opportunities</Text>
        <Text style={s.sub}>Brand deals & collabs for creators</Text>
      </View>

      {/* Category filter */}
      <View style={s.filtersWrap}>
        {CATEGORIES.map(cat => {
          const active = filter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.chip, active && s.chipActive]}
              onPress={() => { Haptics.selectionAsync(); setFilter(cat); }}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, active && s.chipActiveText]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? <EmptyState icon="🎯" title="No opportunities here" subtitle="Try a different category or check back soon." /> : null
        }
      />

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading:      { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  sub:          { color: C.textMuted, fontSize: 13, marginTop: 2 },
  filtersWrap:  { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12, marginTop: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  chipActive:   { borderColor: C.accent, backgroundColor: C.accentDim },
  chipText:     { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  chipActiveText: { color: C.accent, fontWeight: '700' },
  list:         { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  card:         { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTop:      { padding: 16 },
  tagRow:       { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  catPill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent },
  catText:      { color: C.accent, fontSize: 11, fontWeight: '800' },
  deadline:     { color: C.textFaint, fontSize: 12 },
  cardTitle:    { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  bizName:      { color: C.textMuted, fontSize: 13 },
  desc:         { color: C.textMuted, fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 12 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  budget:       { color: C.accent, fontSize: 14, fontWeight: '800' },
  applyBtn:     { backgroundColor: C.accentDim, paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full, borderWidth: 1, borderColor: C.accent },
  applyText:    { color: C.accent, fontSize: 13, fontWeight: '700' },
  appliedPill:  { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  appliedText:  { color: C.success, fontSize: 12, fontWeight: '700' },
});
