import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';
import { C, R, GRAD_HERO } from '../../components/theme';

const DEMO_OPPS = [
  { id: 'o1', title: 'Social Media Ambassador', business_name: 'Nike Sport UK',     budget: '£500–£1,000', category: 'Apparel',    deadline: '2026-06-01', description: 'Looking for UK-based athletes with 5k+ followers for a summer kit campaign.' },
  { id: 'o2', title: 'YouTube Collaboration',   business_name: 'Myprotein',          budget: '£200 + product', category: 'Nutrition', deadline: '2026-05-20', description: 'Review our new recovery range in a training video. Full product supply included.' },
  { id: 'o3', title: 'Event Appearance',        business_name: 'Adidas Grassroots',  budget: '£300/day',   category: 'Footwear',  deadline: '2026-07-15', description: 'Seeking youth athletes to appear at our regional community events this summer.' },
  { id: 'o4', title: 'Podcast Guest Spot',      business_name: 'The Sports Desk',    budget: 'Revenue share', category: 'Media',    deadline: '2026-05-30', description: 'Share your story on our weekly show. Ideal for athletes with an inspiring journey.' },
];

export default function Opportunities() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);

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

  const renderItem = ({ item }) => {
    const isDemo = String(item.id).startsWith('o');
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.tagRow}>
            {item.category && (
              <LinearGradient colors={GRAD_HERO} style={s.catPill}>
                <Text style={s.catText}>{item.category}</Text>
              </LinearGradient>
            )}
            {item.deadline && (
              <Text style={s.deadline}>📅 {new Date(item.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
            )}
          </View>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={s.bizName}>{item.business_name}</Text>
        </View>
        {item.description ? (
          <Text style={s.desc} numberOfLines={3}>{item.description}</Text>
        ) : null}
        <View style={s.cardFooter}>
          {item.budget ? <Text style={s.budget}>{item.budget}</Text> : null}
          <TouchableOpacity style={s.applyBtn} activeOpacity={isDemo ? 1 : 0.85}>
            <Text style={s.applyText}>{isDemo ? 'Demo' : 'Apply →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.heading}>Opportunities</Text>
        <Text style={s.sub}>Brand deals & collabs for creators</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎯</Text>
              <Text style={s.emptyTitle}>No opportunities yet</Text>
              <Text style={s.emptyMsg}>Check back soon — brands are onboarding now.</Text>
            </View>
          ) : null
        }
      />

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  header:     { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  heading:    { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  sub:        { color: C.textMuted, fontSize: 13, marginTop: 2 },
  list:       { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  card:       { backgroundColor: C.surface, borderRadius: R.xl, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTop:    { padding: 16 },
  tagRow:     { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  catPill:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  catText:    { color: '#fff', fontSize: 11, fontWeight: '800' },
  deadline:   { color: C.textFaint, fontSize: 12 },
  cardTitle:  { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  bizName:    { color: C.textMuted, fontSize: 13 },
  desc:       { color: C.textMuted, fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  budget:     { color: C.accent, fontSize: 14, fontWeight: '800' },
  applyBtn:   { backgroundColor: C.accentDim, paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full },
  applyText:  { color: C.accent, fontSize: 13, fontWeight: '700' },
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyMsg:   { color: C.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
