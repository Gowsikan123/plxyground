import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import PostCard from './PostCard';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { spacing } from '../../constants/spacing';

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="50%" height={12} />
          <Skeleton width="30%" height={10} />
        </View>
      </View>
      <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={13} style={{ marginBottom: 4 }} />
      <Skeleton width="70%" height={13} />
    </View>
  );
}

const FeedList = React.memo(({ posts, isLoading, isRefreshing, hasMore, onRefresh, onLoadMore, ListHeaderComponent }) => {
  if (isLoading && !posts.length) {
    return (
      <View style={styles.container}>
        {ListHeaderComponent ? <ListHeaderComponent /> : null}
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </View>
    );
  }

  return (
    <FlashList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <PostCard post={item} />}
      estimatedItemSize={220}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon="🏀"
            title="No posts yet"
            subtitle="Be the first to create content on PLXYGROUND!"
          />
        ) : null
      }
      contentContainerStyle={styles.list}
    />
  );
});

FeedList.displayName = 'FeedList';
export default FeedList;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  list: { padding: spacing.lg },
  skeletonCard: { backgroundColor: '#141414', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
});
