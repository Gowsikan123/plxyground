import { useState, useCallback } from 'react';
import { getFeed } from '../services/contentService';

export function useFeed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasMore = posts.length < total;

  const loadFeed = useCallback(async (reset = false, sport) => {
    if (isLoading) return;
    const targetPage = reset ? 1 : page;
    reset ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    const { data, error: err } = await getFeed(targetPage, sport);
    if (err) {
      setError(err);
    } else {
      setPosts(reset ? data.data : (prev) => [...prev, ...data.data]);
      setTotal(data.meta.total);
      setPage(targetPage + 1);
    }
    reset ? setIsRefreshing(false) : setIsLoading(false);
  }, [isLoading, page]);

  return { posts, isLoading, isRefreshing, error, hasMore, loadFeed };
}
