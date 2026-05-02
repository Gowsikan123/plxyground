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
  filters:    { search: '', sport: '', tags: '' },

  setFilter: (key, value) => {
    set(s => ({ filters: { ...s.filters, [key]: value } }));
    get().refresh();
  },

  refresh: async () => {
    const { limit, filters } = get();
    set({ isRefreshing: true, error: null, page: 0, hasMore: true });
    const { data, error } = await contentService.getFeed({ ...filters, limit, offset: 0 });
    if (error) { set({ isRefreshing: false, error }); return; }
    set({
      posts:       data.data || [],
      total:       data.total || 0,
      page:        1,
      hasMore:     (data.data || []).length === limit,
      isRefreshing: false,
    });
  },

  loadMore: async () => {
    const { isLoading, hasMore, page, limit, filters, posts } = get();
    if (isLoading || !hasMore) return;
    set({ isLoading: true });
    const { data, error } = await contentService.getFeed({ ...filters, limit, offset: page * limit });
    if (error) { set({ isLoading: false, error }); return; }
    const newPosts = data.data || [];
    set({
      posts:    [...posts, ...newPosts],
      page:     page + 1,
      hasMore:  newPosts.length === limit,
      isLoading: false,
    });
  },

  reset: () => set({ posts: [], total: 0, page: 0, hasMore: true, isLoading: false, isRefreshing: false, error: null }),
}));
