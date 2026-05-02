import { useState, useCallback } from 'react';
import { opportunityService } from '../services/opportunityService';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetch = useCallback(async ({ search = '', sport = '', reset = true } = {}) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setIsLoading(true);
      setOpportunities([]);
      setOffset(0);
    } else {
      setIsFetchingMore(true);
    }
    setError(null);

    const { data, error: err } = await opportunityService.getOpportunities({ search, sport, limit, offset: currentOffset });

    if (err) {
      setError(err);
    } else {
      setOpportunities((prev) => reset ? data.data : [...prev, ...data.data]);
      setTotal(data.total);
      setOffset(currentOffset + data.data.length);
    }
    setIsLoading(false);
    setIsFetchingMore(false);
  }, [offset]);

  const refresh = useCallback(async (params = {}) => {
    setIsRefreshing(true);
    await fetch({ ...params, reset: true });
    setIsRefreshing(false);
  }, [fetch]);

  const loadMore = useCallback((params = {}) => {
    if (!isFetchingMore && opportunities.length < total) {
      fetch({ ...params, reset: false });
    }
  }, [isFetchingMore, opportunities.length, total, fetch]);

  return { opportunities, total, isLoading, isRefreshing, isFetchingMore, error, fetch, refresh, loadMore };
}
