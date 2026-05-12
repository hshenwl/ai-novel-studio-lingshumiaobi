import { create } from 'zustand';
import { WorldBuilding } from '../api/types';
import { worldBuildingService } from '../api/services/worldBuilding';

interface WorldBuildingState {
  items: WorldBuilding[];
  currentItem: WorldBuilding | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<WorldBuilding>) => Promise<void>;
  update: (id: string, data: Partial<WorldBuilding>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentItem: (item: WorldBuilding | null) => void;
}

export const useWorldBuildingStore = create<WorldBuildingState>((set, get) => ({
  items: [],
  currentItem: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await worldBuildingService.getList(projectId, { page: 1, pageSize: 100 });
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
      const res = await worldBuildingService.getById(id);
      if (res.code === 0) {
        set({ currentItem: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<WorldBuilding>) => {
    const res = await worldBuildingService.create(data);
    if (res.code === 0) {
      const { items } = get();
      set({ items: [...items, res.data] });
    }
  },

  update: async (id: string, data: Partial<WorldBuilding>) => {
    const res = await worldBuildingService.update(id, data);
    if (res.code === 0) {
      const { items } = get();
      set({
        items: items.map(item => item.id === id ? res.data : item),
        currentItem: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await worldBuildingService.delete(id);
    const { items } = get();
    set({ items: items.filter(item => item.id !== id) });
  },

  setCurrentItem: (item: WorldBuilding | null) => set({ currentItem: item }),
}));