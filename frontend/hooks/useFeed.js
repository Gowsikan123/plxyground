import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed(filters = {}) {
  const {
    posts, total, isLoading, isRefreshing, isFetchingMore, error,
    fetchFeed, refresh, setFilters,
  } = useFeedStore();

  useEffect(() => {
    if (filters.search !== undefined || filters.sport !== undefined) {
      setFilters(filters);
    }
    fetchFeed(true);
  }, [filters.search, filters.sport]);

  const loadMore = useCallback(() => {
    if (!isFetchingMore && posts.length < total) {
      fetchFeed(false);
    }
  }, [isFetchingMore, posts.length, total]);

  return { posts, total, isLoading, isRefreshing, isFetchingMore, error, refresh, loadMore };
}
