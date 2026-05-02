import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatorCard } from '../../components/CreatorCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { ENDPOINTS } from '../../constants/api';

export default function Discover() {
  const insets = useSafeAreaInsets();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get(ENDPOINTS.CREATORS).then(({ data }) => {
      setCreators(data?.creators || data || []);
      setLoading(false);
    });
  }, []);

  const filtered = query.trim()
    ? creators.filter(
        (c) =>
          c.display_name?.toLowerCase().includes(query.toLowerCase()) ||
          c.sport?.toLowerCase().includes(query.toLowerCase()) ||
          c.username?.toLowerCase().includes(query.toLowerCase())
      )
    : creators;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Discover Creators</Text>
        <TextInput
          style={styles.search}
          placeholder="Search by name, sport..."
          placeholderTextColor={Colors.textFaint}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CreatorCard creator={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="🔍" title="No creators found" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading: { color: Colors.text, fontSize: 22, fontFamily: 'Syne_700Bold', marginBottom: 12 },
  search: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  list: { padding: 12 },
});
