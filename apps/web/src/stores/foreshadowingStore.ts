import { create } from 'zustand';
import { Foreshadowing } from '../api/types';
import { foreshadowingService } from '../api/services/foreshadowing';

interface ForeshadowingState {
  items: Foreshadowing[];
  currentItem: Foreshadowing | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<Foreshadowing>) => Promise<void>;
  update: (id: string, data: Partial<Foreshadowing>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentItem: (item: Foreshadowing | null) => void;
}

export const useForeshadowingStore = create<ForeshadowingState>((set, get) => ({
  items: [],
  currentItem: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await foreshadowingService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ items: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await foreshadowingService.getById(id);
      if (res.code === 0) {
        set({ currentItem: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<Foreshadowing>) => {
    const res = await foreshadowingService.create(data);
    if (res.code === 0) {
      const { items } = get();
      set({ items: [...items, res.data] });
    }
  },

  update: async (id: string, data: Partial<Foreshadowing>) => {
    const res = await foreshadowingService.update(id, data);
    if (res.code === 0) {
      const { items } = get();
      set({
        items: items.map(item => item.id === id ? res.data : item),
        currentItem: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await foreshadowingService.delete(id);
    const { items } = get();
    set({ items: items.filter(item => item.id !== id) });
  },

  setCurrentItem: (item: Foreshadowing | null) => set({ currentItem: item }),
}));