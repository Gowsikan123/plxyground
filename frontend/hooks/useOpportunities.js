import { useState, useCallback } from 'react';
import { opportunityService } from '../services/opportunityService';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(0);
  const [hasMore,       setHasMore]       = useState(true);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [error,         setError]         = useState(null);
  const LIMIT = 20;

  const fetch = useCallback(async ({ reset = false, search = '', sport = '' } = {}) => {
    if (isLoading) return;
    const nextPage = reset ? 0 : page;
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await opportunityService.getAll({
      limit:  LIMIT,
      offset: nextPage * LIMIT,
      search,
      sport,
    });
    if (err) { setError(err); setIsLoading(false); return; }
    const rows = data.data || [];
    setOpportunities(prev => reset ? rows : [...prev, ...rows]);
    setTotal(data.total || 0);
    setPage(nextPage + 1);
    setHasMore(rows.length === LIMIT);
    setIsLoading(false);
  }, [isLoading, page]);

  const refresh = useCallback(async (filters = {}) => {
    setIsRefreshing(true);
    setOpportunities([]);
    setPage(0);
    setHasMore(true);
    await fetch({ reset: true, ...filters });
    setIsRefreshing(false);
  }, [fetch]);

  const create = useCallback(async (fields) => {
    const { data, error: err } = await opportunityService.create(fields);
    if (!err && data) setOpportunities(prev => [data, ...prev]);
    return { data, error: err };
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await opportunityService.remove(id);
    if (!err) setOpportunities(prev => prev.filter(o => o.id !== id));
    return { error: err };
  }, []);

  return {
    opportunities, total, hasMore,
    isLoading, isRefreshing, error,
    fetch, refresh, create, remove,
    clearError: () => setError(null),
  };
}
