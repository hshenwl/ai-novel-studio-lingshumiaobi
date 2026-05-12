import { create } from 'zustand';
import { Hook } from '../api/types';
import { hookService } from '../api/services/hook';

interface HookState {
  hooks: Hook[];
  currentHook: Hook | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<Hook>) => Promise<void>;
  update: (id: string, data: Partial<Hook>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentHook: (hook: Hook | null) => void;
}

export const useHookStore = create<HookState>((set, get) => ({
  hooks: [],
  currentHook: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await hookService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ hooks: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await hookService.getById(id);
      if (res.code === 0) {
        set({ currentHook: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<Hook>) => {
    const res = await hookService.create(data);
    if (res.code === 0) {
      const { hooks } = get();
      set({ hooks: [...hooks, res.data] });
    }
  },

  update: async (id: string, data: Partial<Hook>) => {
    const res = await hookService.update(id, data);
    if (res.code === 0) {
      const { hooks } = get();
      set({
        hooks: hooks.map(h => h.id === id ? res.data : h),
        currentHook: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await hookService.delete(id);
    const { hooks } = get();
    set({ hooks: hooks.filter(h => h.id !== id) });
  },

  setCurrentHook: (hook: Hook | null) => set({ currentHook: hook }),
}));