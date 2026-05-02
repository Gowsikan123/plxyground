import { create } from 'zustand';
import { contentService } from '../services/contentService';

export const useFeedStore = create((set, get) => ({
  posts:       [],
  total:       0,
  page:        0,
  limit:       20,
  isLoading:   false,
  isRefreshing:false,
  hasMore:     true,
  error:       null,
  filters:     { search: '', sport: '' },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, posts: [], page: 0, hasMore: true });
    get().loadFeed(true);
  },

  loadFeed: async (reset = false) => {
    const { isLoading, hasMore, page, limit, filters } = get();
    if (isLoading) return;
    if (!reset && !hasMore) return;
    set({ isLoading: true, error: null });
    const nextPage = reset ? 0 : page;
    const { data, error } = await contentService.getFeed({
      limit,
      offset: nextPage * limit,
      search: filters.search || undefined,
      sport:  filters.sport  || undefined,
    });
    if (error) {
      set({ isLoading: false, error });
      return;
    }
    const newPosts = data.data || [];
    set({
      posts:     reset ? newPosts : [...get().posts, ...newPosts],
      total:     data.total || 0,
      page:      nextPage + 1,
      hasMore:   newPosts.length === limit,
      isLoading: false,
    });
  },

  refresh: async () => {
    set({ isRefreshing: true, posts: [], page: 0, hasMore: true });
    await get().loadFeed(true);
    set({ isRefreshing: false });
  },

  clearError: () => set({ error: null }),
}));
