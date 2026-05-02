import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { PostCard } from './PostCard';
import { SkeletonCard } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const SKELETON_COUNT = 4;

export const FeedList = React.memo(({ posts, isLoading, isRefreshing, hasMore, onLoadMore, onRefresh, ListHeaderComponent }) => {
  const renderItem = useCallback(({ item }) => <PostCard post={item} />, []);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.skeletons}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      );
    }
    return (
      <EmptyState
        title="No posts yet"
        message="Follow creators and check back soon."
      />
    );
  }, [isLoading]);

  const ListFooterComponent = useCallback(() => {
    if (!hasMore || !isLoading || posts.length === 0) return <View style={styles.footer} />;
    return (
      <View style={styles.skeletons}>
        {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
      </View>
    );
  }, [hasMore, isLoading, posts.length]);

  return (
    <FlashList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={280}
      contentContainerStyle={styles.list}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.4}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      showsVerticalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  list:     { padding: spacing.base, backgroundColor: colors.background },
  skeletons:{ paddingTop: spacing.sm },
  footer:   { height: spacing.xxxl },
});
