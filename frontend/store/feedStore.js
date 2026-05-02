import { create } from 'zustand';
import { contentService } from '../services/contentService';

export const useFeedStore = create((set, get) => ({
  posts: [],
  total: 0,
  offset: 0,
  limit: 20,
  isLoading: false,
  isRefreshing: false,
  isFetchingMore: false,
  error: null,
  search: '',
  sport: '',

  setFilters: (filters) => {
    set({ ...filters, posts: [], offset: 0 });
  },

  fetchFeed: async (reset = false) => {
    const { limit, search, sport, posts } = get();
    const offset = reset ? 0 : posts.length;

    if (reset) {
      set({ isLoading: true, error: null, posts: [], offset: 0 });
    } else {
      set({ isFetchingMore: true });
    }

    const { data, error } = await contentService.getFeed({ search, sport, limit, offset });

    if (error) {
      set({ error, isLoading: false, isFetchingMore: false });
      return;
    }

    set((state) => ({
      posts: reset ? data.data : [...state.posts, ...data.data],
      total: data.total,
      offset: offset + data.data.length,
      isLoading: false,
      isFetchingMore: false,
      error: null,
    }));
  },

  refresh: async () => {
    set({ isRefreshing: true });
    const { limit, search, sport } = get();
    const { data, error } = await contentService.getFeed({ search, sport, limit, offset: 0 });

    if (!error) {
      set({ posts: data.data, total: data.total, offset: data.data.length, error: null });
    }
    set({ isRefreshing: false });
  },
}));
