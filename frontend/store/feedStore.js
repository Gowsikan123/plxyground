import { create } from 'zustand';
import { getFeed } from '../services/contentService';

const LIMIT = 20;

export const useFeedStore = create((set, get) => ({
  posts: [],
  total: 0,
  offset: 0,
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  search: '',
  sport: '',
  _searchTimer: null,

  fetchPosts: async () => {
    const { search, sport } = get();
    set({ isLoading: true });
    const { data, error } = await getFeed({ search, sport, limit: LIMIT, offset: 0 });
    if (!error && data) {
      set({
        posts: data.data || [],
        total: data.total || 0,
        offset: LIMIT,
        hasMore: (data.data || []).length === LIMIT,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  refreshPosts: async () => {
    const { search, sport } = get();
    set({ isRefreshing: true });
    const { data, error } = await getFeed({ search, sport, limit: LIMIT, offset: 0 });
    if (!error && data) {
      set({
        posts: data.data || [],
        total: data.total || 0,
        offset: LIMIT,
        hasMore: (data.data || []).length === LIMIT,
        isRefreshing: false,
      });
    } else {
      set({ isRefreshing: false });
    }
  },

  loadMorePosts: async () => {
    const { isLoading, hasMore, posts, offset, search, sport } = get();
    if (isLoading || !hasMore) return;
    set({ isLoading: true });
    const { data, error } = await getFeed({ search, sport, limit: LIMIT, offset });
    if (!error && data) {
      const newPosts = data.data || [];
      set({
        posts: [...posts, ...newPosts],
        offset: offset + LIMIT,
        hasMore: newPosts.length === LIMIT,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  setSearch: (query) => {
    const { _searchTimer } = get();
    if (_searchTimer) clearTimeout(_searchTimer);
    const timer = setTimeout(() => {
      set({ search: query, offset: 0, posts: [], hasMore: true });
      get().fetchPosts();
    }, 400);
    set({ _searchTimer: timer });
  },

  setSport: (sport) => {
    set({ sport, offset: 0, posts: [], hasMore: true });
    get().fetchPosts();
  },
}));
