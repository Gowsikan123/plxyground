import { create } from 'zustand';

export const useSavedStore = create((set, get) => ({
  savedPosts: [],
  savedIds: new Set(),

  save: (post) => set(s => {
    if (s.savedIds.has(post.id)) return s;
    const next = new Set(s.savedIds);
    next.add(post.id);
    return { savedPosts: [post, ...s.savedPosts], savedIds: next };
  }),

  unsave: (id) => set(s => {
    const next = new Set(s.savedIds);
    next.delete(id);
    return { savedPosts: s.savedPosts.filter(p => p.id !== id), savedIds: next };
  }),

  toggle: (post) => {
    const { savedIds, save, unsave } = get();
    savedIds.has(post.id) ? unsave(post.id) : save(post);
  },

  isSaved: (id) => get().savedIds.has(id),
}));
