import { create } from 'zustand';
import { ChapterOutline } from '../api/types';
import { chapterOutlineService } from '../api/services/chapterOutline';

interface ChapterOutlineState {
  outlines: ChapterOutline[];
  currentOutline: ChapterOutline | null;
  loading: boolean;
  fetchList: (projectId: string, volumeId?: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<ChapterOutline>) => Promise<void>;
  update: (id: string, data: Partial<ChapterOutline>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentOutline: (outline: ChapterOutline | null) => void;
}

export const useChapterOutlineStore = create<ChapterOutlineState>((set, get) => ({
  outlines: [],
  currentOutline: null,
  loading: false,

  fetchList: async (projectId: string, volumeId?: string) => {
    set({ loading: true });
    try {
      const res = await chapterOutlineService.getList(projectId, volumeId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ outlines: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await chapterOutlineService.getById(id);
      if (res.code === 0) {
        set({ currentOutline: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<ChapterOutline>) => {
    const res = await chapterOutlineService.create(data);
    if (res.code === 0) {
      const { outlines } = get();
      set({ outlines: [...outlines, res.data] });
    }
  },

  update: async (id: string, data: Partial<ChapterOutline>) => {
    const res = await chapterOutlineService.update(id, data);
    if (res.code === 0) {
      const { outlines } = get();
      set({
        outlines: outlines.map(o => o.id === id ? res.data : o),
        currentOutline: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await chapterOutlineService.delete(id);
    const { outlines } = get();
    set({ outlines: outlines.filter(o => o.id !== id) });
  },

  setCurrentOutline: (outline: ChapterOutline | null) => set({ currentOutline: outline }),
}));