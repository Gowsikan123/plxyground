import { useState, useEffect, useCallback } from 'react';
import { opportunityService } from '../services/opportunityService';

export function useOpportunities({ search = '', sport = '' } = {}) {
  const [opportunities, setOpportunities] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(0);
  const [hasMore,       setHasMore]       = useState(true);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [error,         setError]         = useState(null);

  const LIMIT = 20;

  const load = useCallback(async (reset = false) => {
    if (isLoading) return;
    const nextPage = reset ? 0 : page;
    setIsLoading(true); setError(null);
    const { data, error: err } = await opportunityService.getOpportunities({
      limit:  LIMIT,
      offset: nextPage * LIMIT,
      search: search || undefined,
      sport:  sport  || undefined,
    });
    if (err) { setError(err); setIsLoading(false); return; }
    const items = data?.data || [];
    setOpportunities(reset ? items : prev => [...prev, ...items]);
    setTotal(data?.total || 0);
    setPage(nextPage + 1);
    setHasMore(items.length === LIMIT);
    setIsLoading(false);
  }, [page, isLoading, search, sport]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setOpportunities([]); setPage(0); setHasMore(true);
    await load(true);
    setIsRefreshing(false);
  }, [load]);

  useEffect(() => { load(true); }, [search, sport]);

  return {
    opportunities, total, isLoading, isRefreshing, hasMore, error,
    loadMore: () => load(false),
    refresh,
  };
}
