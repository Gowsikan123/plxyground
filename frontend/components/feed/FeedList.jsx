import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PostCard } from './PostCard';
import { SkeletonCard } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export function FeedList({ posts, isLoading, isRefreshing, error, hasMore, onRefresh, onEndReached }) {
  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.list}>
        {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <EmptyState
        title="Could not load feed"
        message={error}
        actionLabel="Retry"
        onAction={onRefresh}
      />
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        message="Be the first to post something."
      />
    );
  }

  return (
    <FlashList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <PostCard post={item} />}
      estimatedItemSize={160}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      onEndReached={hasMore ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[4] },
  content: { padding: Spacing[4] },
});
