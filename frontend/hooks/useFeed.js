import { useEffect } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed() {
  const {
    posts,
    total,
    isLoading,
    isRefreshing,
    hasMore,
    search,
    sport,
    fetchPosts,
    refreshPosts,
    loadMorePosts,
    setSearch,
    setSport,
  } = useFeedStore();

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    total,
    isLoading,
    isRefreshing,
    hasMore,
    search,
    sport,
    refresh: refreshPosts,
    loadMore: loadMorePosts,
    setSearch,
    setSport,
  };
}
