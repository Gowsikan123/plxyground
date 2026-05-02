import { useEffect } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useFeed() {
  const { posts, loading, refreshing, hasMore, error, fetchFeed, refreshFeed, loadMore } = useFeedStore();

  useEffect(() => {
    if (!posts.length) fetchFeed();
  }, []);

  return { posts, loading, refreshing, hasMore, error, refreshFeed, loadMore };
}
