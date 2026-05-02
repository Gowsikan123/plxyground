import { useState, useCallback } from 'react';
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from '../services/opportunityService';

const LIMIT = 20;

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearchVal] = useState('');
  const [sport, setSportVal] = useState('');
  const [error, setError] = useState(null);

  const fetch = useCallback(async (opts = {}) => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await getOpportunities({ search, sport, limit: LIMIT, offset: 0, ...opts });
    if (!err && data) {
      setOpportunities(data.data || []);
      setTotal(data.total || 0);
      setOffset(LIMIT);
      setHasMore((data.data || []).length === LIMIT);
    } else {
      setError(err);
    }
    setIsLoading(false);
  }, [search, sport]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const { data, error: err } = await getOpportunities({ search, sport, limit: LIMIT, offset: 0 });
    if (!err && data) {
      setOpportunities(data.data || []);
      setTotal(data.total || 0);
      setOffset(LIMIT);
      setHasMore((data.data || []).length === LIMIT);
    }
    setIsRefreshing(false);
  }, [search, sport]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const { data, error: err } = await getOpportunities({ search, sport, limit: LIMIT, offset });
    if (!err && data) {
      const newItems = data.data || [];
      setOpportunities((prev) => [...prev, ...newItems]);
      setOffset((prev) => prev + LIMIT);
      setHasMore(newItems.length === LIMIT);
    }
    setIsLoading(false);
  }, [isLoading, hasMore, offset, search, sport]);

  const create = useCallback(async (formData) => {
    const { data, error: err } = await createOpportunity(formData);
    if (!err && data) {
      setOpportunities((prev) => [data, ...prev]);
      setTotal((prev) => prev + 1);
    }
    return { data, error: err };
  }, []);

  const update = useCallback(async (id, formData) => {
    const { data, error: err } = await updateOpportunity(id, formData);
    if (!err && data) {
      setOpportunities((prev) => prev.map((o) => (o.id === id ? data : o)));
    }
    return { data, error: err };
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await deleteOpportunity(id);
    if (!err) setOpportunities((prev) => prev.filter((o) => o.id !== id));
    return { error: err };
  }, []);

  const setSearch = useCallback((q) => { setSearchVal(q); fetch({ search: q }); }, [fetch]);
  const setSport = useCallback((s) => { setSportVal(s); fetch({ sport: s }); }, [fetch]);

  return {
    opportunities, total, isLoading, isRefreshing, hasMore, search, sport, error,
    fetch, refresh, loadMore, create, update, remove, setSearch, setSport,
  };
}
