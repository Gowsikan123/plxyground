import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { C, R } from '../components/theme';
import { Header } from '../components/layout/Header';
import { EmptyState } from '../components/ui/EmptyState';
import { useSavedStore } from '../store/savedStore';

export default function Saved() {
  const router = useRouter();
  const { savedPosts, unsave } = useSavedStore();

  return (
    <View style={s.page}>
      <Header title="Saved Posts" showBack />
      <FlatList
        data={savedPosts}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Nothing saved yet"
            message="Tap the bookmark icon on any post to save it here."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${item.id}`); }}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.title} numberOfLines={2}>{item.title}</Text>
              <Text style={s.meta}>{item.display_name} · {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); unsave(item.id); }}
              style={s.removeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.removeText}>Remove</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page:      { flex: 1, backgroundColor: C.bg },
  card:      { backgroundColor: C.surface, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title:     { color: C.text, fontSize: 15, fontWeight: '700' },
  meta:      { color: C.textMuted, fontSize: 12 },
  removeBtn: { paddingLeft: 8 },
  removeText:{ color: C.error, fontSize: 12, fontWeight: '700' },
});
