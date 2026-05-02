import { create } from 'zustand';

export const useFeedStore = create((set, get) => ({
  posts: [],
  page: 1,
  total: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasMore: true,

  setPosts: (posts, total) => set({ posts, total, hasMore: posts.length < total }),

  appendPosts: (newPosts, total) =>
    set((s) => ({
      posts: [...s.posts, ...newPosts],
      total,
      hasMore: s.posts.length + newPosts.length < total,
    })),

  setPage: (page) => set({ page }),
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setError: (error) => set({ error }),
  reset: () => set({ posts: [], page: 1, total: 0, hasMore: true, error: null }),
}));
