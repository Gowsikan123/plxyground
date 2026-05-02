import { useState, useCallback } from 'react';
import { getOpportunities } from '../services/opportunityService';

export function useOpportunities() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasMore = items.length < total;

  const load = useCallback(async (reset = false, sport) => {
    if (isLoading) return;
    const targetPage = reset ? 1 : page;
    reset ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    const { data, error: err } = await getOpportunities(targetPage, sport);
    if (err) {
      setError(err);
    } else {
      setItems(reset ? data.data : (prev) => [...prev, ...data.data]);
      setTotal(data.meta.total);
      setPage(targetPage + 1);
    }
    reset ? setIsRefreshing(false) : setIsLoading(false);
  }, [isLoading, page]);

  return { items, isLoading, isRefreshing, error, hasMore, load };
}
