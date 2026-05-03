import { create } from 'zustand';

export const useBookmarkStore = create((set, get) => ({
  ids: new Set(),
  posts: [],
  toggle: (post) => {
    const { ids, posts } = get();
    const newIds = new Set(ids);
    if (newIds.has(post.id)) {
      newIds.delete(post.id);
      set({ ids: newIds, posts: posts.filter(p => p.id !== post.id) });
    } else {
      newIds.add(post.id);
      set({ ids: newIds, posts: [post, ...posts] });
    }
  },
  has: (id) => get().ids.has(id),
}));
