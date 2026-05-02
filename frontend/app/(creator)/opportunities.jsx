import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Header } from '../../components/layout/Header';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOpportunities } from '../../hooks/useOpportunities';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export default function Opportunities() {
  const { items, isLoading, isRefreshing, error, hasMore, load } = useOpportunities();

  useEffect(() => { load(true); }, []);

  if (isLoading && items.length === 0) return (
    <View style={styles.page}>
      <Header title="Opportunities" />
      <View style={{ padding: Spacing[4] }}>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</View>
    </View>
  );

  if (error && items.length === 0) return (
    <View style={styles.page}>
      <Header title="Opportunities" />
      <EmptyState title="Could not load opportunities" message={error} actionLabel="Retry" onAction={() => load(true)} />
    </View>
  );

  return (
    <View style={styles.page}>
      <Header title="Opportunities" />
      {items.length === 0 && !isLoading ? (
        <EmptyState title="No opportunities yet" message="Check back soon." />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <OpportunityCard item={item} />}
          estimatedItemSize={140}
          contentContainerStyle={{ padding: Spacing[4] }}
          onRefresh={() => load(true)}
          refreshing={isRefreshing}
          onEndReached={hasMore ? () => load(false) : undefined}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: Colors.bg } });
