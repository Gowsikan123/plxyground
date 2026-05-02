import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OpportunityCard } from '../../components/OpportunityCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import api from '../../lib/api';
import { ENDPOINTS } from '../../constants/api';

export default function Opportunities() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(ENDPOINTS.OPPORTUNITIES).then(({ data }) => {
      setItems(data?.opportunities || data || []);
      setLoading(false);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Opportunities</Text>
        <Text style={styles.sub}>Brand deals & collaborations</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <OpportunityCard opportunity={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="📋" title="No opportunities yet" message="Check back soon for brand collaboration opportunities." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heading: { color: Colors.text, fontSize: 22, fontFamily: 'Syne_700Bold' },
  sub: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  list: { padding: 12 },
});
