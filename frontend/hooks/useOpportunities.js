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

  const refresh = useCallback(async (filters = {}) => {
    setIsRefreshing(true); setError(null);
    const { data, error: err } = await opportunityService.listOpportunities({ ...filters, limit: LIMIT, offset: 0 });
    setIsRefreshing(false);
    if (err) { setError(err); return; }
    setOpportunities(data.data || []);
    setTotal(data.meta?.total || 0);
    setPage(1);
    setHasMore((data.data || []).length === LIMIT);
  }, []);

  const loadMore = useCallback(async (filters = {}) => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const { data, error: err } = await opportunityService.listOpportunities({ ...filters, limit: LIMIT, offset: page * LIMIT });
    setIsLoading(false);
    if (err) { setError(err); return; }
    const fresh = data.data || [];
    setOpportunities(prev => [...prev, ...fresh]);
    setPage(p => p + 1);
    setHasMore(fresh.length === LIMIT);
  }, [isLoading, hasMore, page]);

  const create = useCallback(async (payload) => {
    const { data, error: err } = await opportunityService.createOpportunity(payload);
    if (!err) { setOpportunities(prev => [data, ...prev]); }
    return { data, error: err };
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await opportunityService.deleteOpportunity(id);
    if (!err) setOpportunities(prev => prev.filter(o => o.id !== id));
    return { error: err };
  }, []);

  return { opportunities, total, hasMore, isLoading, isRefreshing, error, refresh, loadMore, create, remove };
}
