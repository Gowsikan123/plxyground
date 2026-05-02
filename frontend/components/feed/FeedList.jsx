import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors }     from '../../constants/colors';
import { fontSize }   from '../../constants/typography';
import { spacing }    from '../../constants/spacing';
import { PostCard }   from './PostCard';
import { Skeleton }   from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={80}  height={10} />
        </View>
      </View>
      <Skeleton height={18} style={{ marginBottom: 8 }} />
      <Skeleton height={14} style={{ marginBottom: 4 }} />
      <Skeleton height={14} width="75%" />
    </View>
  );
}

export const FeedList = React.memo(function FeedList({
  posts,
  isLoading,
  isRefreshing,
  hasMore,
  error,
  onRefresh,
  onLoadMore,
  emptyTitle       = 'No posts yet',
  emptyDescription = 'Be the first to share something.',
  ListHeaderComponent,
}) {
  const renderItem = useCallback(({ item }) => <PostCard post={item} />, []);
  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListFooter = useCallback(() => {
    if (!isLoading || posts.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <Skeleton height={12} width={120} />
      </View>
    );
  }, [isLoading, posts.length]);

  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View>
          {[1, 2, 3].map(k => <SkeletonCard key={k} />)}
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          title="Failed to load"
          description={error}
          actionLabel="Retry"
          onAction={onRefresh}
        />
      );
    }
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }, [isLoading, error, emptyTitle, emptyDescription, onRefresh]);

  return (
    <FlashList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={220}
      onEndReached={hasMore ? onLoadMore : null}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={ListEmpty}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
});

const styles = StyleSheet.create({
  list:         { paddingTop: spacing[3], paddingBottom: spacing[12] },
  footerLoader: { padding: spacing[6], alignItems: 'center' },
  skeletonCard: { marginHorizontal: spacing[4], marginBottom: spacing[3], backgroundColor: '#141414', borderRadius: 16, padding: spacing[4], gap: spacing[3] },
  skeletonHeader: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
});
