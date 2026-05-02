import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { opportunityService } from '../../services/opportunityService';
import OpportunityCard from '../../components/layout/OpportunityCard';
import EmptyState from '../../components/ui/EmptyState';
import Header from '../../components/layout/Header';

export default function BusinessOpportunitiesScreen() {
  const { token } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMine = async () => {
    const { data, error } = await opportunityService.listMine(token);
    if (!error && data) setOpportunities(data.opportunities || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchMine(); }, []);

  const refresh = () => { setRefreshing(true); fetchMine(); };

  return (
    <View style={styles.container}>
      <Header
        title="My Opportunities"
        rightAction={{ label: '+ New', onPress: () => router.push('/opportunity/new') }}
      />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[10] }} />
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/opportunity/${item.id}?edit=1`)}>
              <OpportunityCard opportunity={item} showStatus />
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="No opportunities yet"
              message="Post your first opportunity to connect with creators"
              action={{ label: 'Post Opportunity', onPress: () => router.push('/opportunity/new') }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING[4], paddingBottom: SPACING[12] },
  separator: { height: SPACING[3] },
});
