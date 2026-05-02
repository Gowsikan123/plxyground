import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { PostCard } from './PostCard';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

function PostSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton width="100%" height={180} borderRadius={0} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonRow}>
          <Skeleton width={34} height={34} borderRadius={17} />
          <View style={{ flex: 1, gap: spacing[1] }}>
            <Skeleton width="50%" height={12} />
            <Skeleton width="30%" height={10} />
          </View>
        </View>
        <Skeleton width="90%" height={14} style={{ marginBottom: spacing[1] }} />
        <Skeleton width="70%" height={14} style={{ marginBottom: spacing[2] }} />
        <Skeleton width="60%" height={11} />
      </View>
    </View>
  );
}

export function FeedList({ onRefresh, onLoadMore, isRefreshing, isLoading, isFetchingMore, posts, emptyTitle, emptyMessage, emptyIcon, emptyAction, emptyActionLabel }) {
  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
      </View>
    );
  }

  return (
    <FlashList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <PostCard post={item} />}
      estimatedItemSize={280}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState
          icon={emptyIcon ?? '🏟️'}
          title={emptyTitle ?? 'No posts yet'}
          message={emptyMessage ?? 'Check back soon for new content.'}
          actionLabel={emptyActionLabel}
          onAction={emptyAction}
        />
      }
      ListFooterComponent={
        isFetchingMore ? (
          <View style={styles.footer}>
            <Skeleton width={200} height={12} style={{ alignSelf: 'center' }} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing[4] },
  skeletonContainer: { padding: spacing[4], gap: spacing[3] },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  skeletonBody: { padding: spacing[4], gap: spacing[2] },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  footer: { paddingVertical: spacing[4] },
});
