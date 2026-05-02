import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed() {
  const {
    posts, total, hasMore,
    isLoading, isRefreshing, error,
    filters, setFilter,
    refresh, loadMore, reset,
  } = useFeedStore();

  useEffect(() => {
    refresh();
    return () => reset();
  }, []);

  return {
    posts,
    total,
    hasMore,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilter: useCallback(setFilter, []),
    refresh:   useCallback(refresh, []),
    loadMore:  useCallback(loadMore, []),
  };
}
