import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { useOpportunities } from '../../hooks/useOpportunities';
import OpportunityCard from '../../components/layout/OpportunityCard';
import EmptyState from '../../components/ui/EmptyState';
import Header from '../../components/layout/Header';

export default function OpportunitiesScreen() {
  const { opportunities, loading, refreshing, refresh, loadMore, hasMore } = useOpportunities();

  if (loading && opportunities.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Opportunities" />
      <FlatList
        data={opportunities}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/opportunity/${item.id}`)}>
            <OpportunityCard opportunity={item} />
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
        onEndReached={hasMore ? loadMore : null}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No opportunities yet" message="Check back soon — businesses are adding new deals" />}
        ListFooterComponent={hasMore && !refreshing ? <ActivityIndicator color={COLORS.primary} style={styles.footerLoader} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { padding: SPACING[4], paddingBottom: SPACING[12] },
  separator: { height: SPACING[3] },
  footerLoader: { marginVertical: SPACING[4] },
});
