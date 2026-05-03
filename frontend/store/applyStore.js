import { create } from 'zustand';

export const useApplyStore = create((set, get) => ({
  applied: {},
  apply: (id) => {
    set(s => ({ applied: { ...s.applied, [id]: new Date().toISOString() } }));
  },
  hasApplied: (id) => !!get().applied[id],
  appliedAt: (id) => get().applied[id] || null,
}));
