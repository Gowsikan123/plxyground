import { useState, useCallback } from 'react';
import { getFeed } from '../services/contentService';

export function useFeed() {
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasMore = posts.length < total;
  const limit = 20;

  const loadFeed = useCallback(async (reset = false, sport) => {
    if (isLoading) return;
    const targetOffset = reset ? 0 : offset;
    reset ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    const { data, error: err } = await getFeed({ offset: targetOffset, limit, sport });
    if (err) {
      setError(err);
    } else {
      const nextPosts = data?.posts || [];
      setPosts((prev) => (reset ? nextPosts : [...prev, ...nextPosts]));
      setTotal(data?.total || 0);
      setOffset(targetOffset + nextPosts.length);
    }
    reset ? setIsRefreshing(false) : setIsLoading(false);
  }, [isLoading, offset]);

  return { posts, isLoading, isRefreshing, error, hasMore, loadFeed };
}
