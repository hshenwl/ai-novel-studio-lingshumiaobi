import { create } from 'zustand';
import { NovelOutline } from '../api/types';
import { novelOutlineService } from '../api/services/novelOutline';

interface NovelOutlineState {
  outline: NovelOutline | null;
  loading: boolean;
  fetchByProject: (projectId: string) => Promise<void>;
  create: (data: Partial<NovelOutline>) => Promise<void>;
  update: (id: string, data: Partial<NovelOutline>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export const useNovelOutlineStore = create<NovelOutlineState>((set) => ({
  outline: null,
  loading: false,

  fetchByProject: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await novelOutlineService.getByProject(projectId);
      if (res.code === 0) {
        set({ outline: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<NovelOutline>) => {
    const res = await novelOutlineService.create(data);
    if (res.code === 0) {
      set({ outline: res.data });
    }
  },

  update: async (id: string, data: Partial<NovelOutline>) => {
    const res = await novelOutlineService.update(id, data);
    if (res.code === 0) {
      set({ outline: res.data });
    }
  },

  delete: async (id: string) => {
    await novelOutlineService.delete(id);
    set({ outline: null });
  },
}));