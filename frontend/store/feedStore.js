import { create } from 'zustand';
import contentService from '../services/contentService';

const useFeedStore = create((set, get) => ({
  // ─ State ─────────────────────────────────────────────────────
  posts:       [],
  meta:        { page: 1, limit: 20, total: 0, pages: 1 },
  isLoading:   false,
  isRefreshing:false,
  isFetchingMore: false,
  error:       null,
  filters:     { sport: null, search: null },

  // ─ Actions ───────────────────────────────────────────────

  /** Initial load or filter change — resets to page 1. */
  async loadFeed(filters = {}) {
    const mergedFilters = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: mergedFilters, posts: [] });
    try {
      const { data, meta } = await contentService.getFeed({ page: 1, ...mergedFilters });
      set({ posts: data, meta, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /** Pull-to-refresh — reloads page 1, keeps existing posts visible during load. */
  async refreshFeed() {
    const { filters } = get();
    set({ isRefreshing: true, error: null });
    try {
      const { data, meta } = await contentService.getFeed({ page: 1, ...filters });
      set({ posts: data, meta, isRefreshing: false });
    } catch (err) {
      set({ error: err.message, isRefreshing: false });
    }
  },

  /** Infinite scroll — appends next page. */
  async fetchMore() {
    const { meta, isFetchingMore, filters } = get();
    if (isFetchingMore) return;
    if (meta.page >= meta.pages) return;
    set({ isFetchingMore: true });
    try {
      const nextPage = meta.page + 1;
      const { data, meta: newMeta } = await contentService.getFeed({ page: nextPage, ...filters });
      set((s) => ({
        posts: [...s.posts, ...data],
        meta:  newMeta,
        isFetchingMore: false,
      }));
    } catch (err) {
      set({ error: err.message, isFetchingMore: false });
    }
  },

  /** Optimistically remove a deleted post from the list. */
  removePost(id) {
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
  },

  /** Optimistically update a post in the list. */
  updatePost(id, patch) {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },

  setFilters(filters) {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearError() {
    set({ error: null });
  },
}));

export default useFeedStore;
