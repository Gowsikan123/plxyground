import { create } from 'zustand';
import { api } from '../services/api';

export const useFeedStore = create((set, get) => ({
  posts: [],
  loading: false,
  refreshing: false,
  page: 0,
  hasMore: true,
  error: null,

  fetchFeed: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await api.get('/content?limit=20&offset=0');
      set({ posts: data.data || [], page: 1, hasMore: (data.data?.length || 0) < data.total, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  refreshFeed: async () => {
    set({ refreshing: true, error: null });
    try {
      const data = await api.get('/content?limit=20&offset=0');
      set({ posts: data.data || [], page: 1, hasMore: (data.data?.length || 0) < data.total, refreshing: false });
    } catch (err) {
      set({ refreshing: false, error: err.message });
    }
  },

  loadMore: async () => {
    const { loading, hasMore, page, posts } = get();
    if (loading || !hasMore) return;
    set({ loading: true });
    try {
      const offset = page * 20;
      const data = await api.get(`/content?limit=20&offset=${offset}`);
      const newPosts = data.data || [];
      set({
        posts: [...posts, ...newPosts],
        page: page + 1,
        hasMore: posts.length + newPosts.length < data.total,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
