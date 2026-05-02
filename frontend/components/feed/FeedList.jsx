import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PostCard } from './PostCard';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

function PostSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <Skeleton width={32} height={32} borderRadius={9999} />
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
      <Skeleton width="90%" height={16} style={{ marginBottom: spacing[2] }} />
      <Skeleton width="100%" height={12} style={{ marginBottom: spacing[1] }} />
      <Skeleton width="80%" height={12} />
    </View>
  );
}

export function FeedList({ posts, isLoading, isRefreshing, hasMore, onRefresh, onEndReached, error }) {
  const renderItem = useCallback(({ item }) => <PostCard post={item} />, []);
  const keyExtractor = useCallback((item) => String(item.id), []);
  const renderFooter = useCallback(() => {
    if (!isLoading || !posts.length) return null;
    return <PostSkeleton />;
  }, [isLoading, posts.length]);

  if (isLoading && !posts.length) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
      </View>
    );
  }

  if (error && !posts.length) {
    return (
      <EmptyState
        icon="⚠️"
        title="Failed to load feed"
        message={error}
        actionLabel="Try again"
        onAction={onRefresh}
      />
    );
  }

  if (!posts.length) {
    return (
      <EmptyState
        icon="🏅"
        title="Nothing here yet"
        message="Be the first to post something. The feed will fill up fast."
        actionLabel="Refresh"
        onAction={onRefresh}
      />
    );
  }

  return (
    <FlashList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={220}
      contentContainerStyle={styles.list}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing[4] },
  list:      { padding: spacing[4] },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius:    16,
    padding:         spacing[4],
    marginBottom:    spacing[3],
    gap:             spacing[2],
    borderWidth:     1,
    borderColor:     colors.border,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
    marginBottom:  spacing[3],
  },
});
