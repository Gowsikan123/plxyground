import { create } from 'zustand';
import { contentService } from '../services/contentService';

export const useFeedStore = create((set, get) => ({
  posts:      [],
  total:      0,
  page:       0,
  limit:      20,
  hasMore:    true,
  isLoading:  false,
  isRefreshing: false,
  error:      null,
  filters:    { search: '', sport: '' },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, posts: [], page: 0, hasMore: true });
    get().fetchFeed(true);
  },

  fetchFeed: async (reset = false) => {
    const s = get();
    if (s.isLoading) return;
    const page = reset ? 0 : s.page;
    set({ isLoading: true, error: null });
    const { data, error } = await contentService.getFeed({
      limit:  s.limit,
      offset: page * s.limit,
      search: s.filters.search,
      sport:  s.filters.sport,
    });
    if (error) {
      set({ isLoading: false, error });
      return;
    }
    set({
      posts:   reset ? (data.data || []) : [...s.posts, ...(data.data || [])],
      total:   data.total || 0,
      page:    page + 1,
      hasMore: (data.data || []).length === s.limit,
      isLoading: false,
    });
  },

  refresh: async () => {
    set({ isRefreshing: true, posts: [], page: 0, hasMore: true });
    await get().fetchFeed(true);
    set({ isRefreshing: false });
  },

  prependPost: (post) => set(s => ({ posts: [post, ...s.posts], total: s.total + 1 })),

  updatePost: (id, updates) => set(s => ({
    posts: s.posts.map(p => p.id === id ? { ...p, ...updates } : p),
  })),

  removePost: (id) => set(s => ({
    posts:  s.posts.filter(p => p.id !== id),
    total:  Math.max(0, s.total - 1),
  })),

  clearError: () => set({ error: null }),
}));
