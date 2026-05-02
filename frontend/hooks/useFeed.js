import { useEffect } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed() {
  const {
    posts, total, isLoading, isRefreshing, hasMore, error,
    loadFeed, refresh, setFilters, clearError,
  } = useFeedStore();

  useEffect(() => {
    if (posts.length === 0) loadFeed(true);
  }, []);

  return {
    posts, total, isLoading, isRefreshing, hasMore, error,
    loadMore:   () => loadFeed(false),
    refresh,
    setFilters,
    clearError,
  };
}
