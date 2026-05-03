import { useState, useCallback } from 'react';
import { getOpportunities } from '../services/opportunityService';

export function useOpportunities() {
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasMore = items.length < total;
  const limit = 20;

  const load = useCallback(async (reset = false, sport) => {
    if (isLoading) return;
    const targetOffset = reset ? 0 : offset;
    reset ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);
    const { data, error: err } = await getOpportunities({ offset: targetOffset, limit, sport });
    if (err) {
      setError(err);
    } else {
      const nextItems = data?.opportunities || [];
      setItems((prev) => (reset ? nextItems : [...prev, ...nextItems]));
      setTotal(data?.total || 0);
      setOffset(targetOffset + nextItems.length);
    }
    reset ? setIsRefreshing(false) : setIsLoading(false);
  }, [isLoading, offset]);

  return { items, isLoading, isRefreshing, error, hasMore, load };
}
