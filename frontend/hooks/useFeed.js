import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed() {
  const store = useFeedStore();

  useEffect(() => {
    if (store.posts.length === 0 && !store.isLoading) {
      store.fetchFeed(true);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!store.isLoading && store.hasMore) store.fetchFeed();
  }, [store.isLoading, store.hasMore, store.fetchFeed]);

  const refresh = useCallback(() => store.refresh(), [store.refresh]);

  return {
    posts:        store.posts,
    total:        store.total,
    hasMore:      store.hasMore,
    isLoading:    store.isLoading,
    isRefreshing: store.isRefreshing,
    error:        store.error,
    filters:      store.filters,
    loadMore,
    refresh,
    setFilters:   store.setFilters,
    clearError:   store.clearError,
  };
}
