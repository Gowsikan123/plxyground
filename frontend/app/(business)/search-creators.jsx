import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Text, TouchableOpacity } from 'react-native';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getCreators } from '../../services/creatorService';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function SearchCreators() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = async (query) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getCreators({ q: query, limit: 30 });
    if (err) setError(err);
    else setCreators(data.data);
    setLoading(false);
  };

  useEffect(() => { search(''); }, []);

  if (loading) return (
    <View style={styles.page}>
      <Header title="Find Creators" />
      <View style={{ padding: Spacing[4] }}>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</View>
    </View>
  );

  return (
    <View style={styles.page}>
      <Header title="Find Creators" />
      <View style={styles.searchBar}>
        <TextInput
          value={q}
          onChangeText={(v) => { setQ(v); search(v); }}
          placeholder="Search by name or username..."
          placeholderTextColor={Colors.textFaint}
          style={styles.input}
        />
      </View>
      {creators.length === 0 ? (
        <EmptyState title="No creators found" message="Try a different search." />
      ) : (
        <FlashList
          data={creators}
          keyExtractor={(c) => String(c.id)}
          estimatedItemSize={80}
          contentContainerStyle={{ padding: Spacing[4] }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/creator/${item.slug}`)} style={styles.row}>
              <Avatar uri={item.avatar_url} name={item.display_name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.handle}>@{item.username}</Text>
              </View>
              {item.sport ? <Badge label={item.sport} /> : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bg },
  searchBar: { padding: Spacing[4] },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], fontSize: Typography.sizes.base, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing[3], marginBottom: Spacing[2], borderWidth: 1, borderColor: Colors.border },
  name: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.base, color: Colors.text },
  handle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
});
