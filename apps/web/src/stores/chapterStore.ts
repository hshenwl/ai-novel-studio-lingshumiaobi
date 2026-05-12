import { create } from 'zustand';
import { Chapter } from '../api/types';
import { chapterService } from '../api/services/chapter';

interface ChapterState {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<Chapter>) => Promise<void>;
  update: (id: string, data: Partial<Chapter>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentChapter: (chapter: Chapter | null) => void;
  saveContent: (id: string, content: string) => Promise<void>;
}

export const useChapterStore = create<ChapterState>((set, get) => ({
  chapters: [],
  currentChapter: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await chapterService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ chapters: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await chapterService.getById(id);
      if (res.code === 0) {
        set({ currentChapter: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<Chapter>) => {
    const res = await chapterService.create(data);
    if (res.code === 0) {
      const { chapters } = get();
      set({ chapters: [...chapters, res.data] });
    }
  },

  update: async (id: string, data: Partial<Chapter>) => {
    const res = await chapterService.update(id, data);
    if (res.code === 0) {
      const { chapters } = get();
      set({
        chapters: chapters.map(c => c.id === id ? res.data : c),
        currentChapter: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await chapterService.delete(id);
    const { chapters } = get();
    set({ chapters: chapters.filter(c => c.id !== id) });
  },

  setCurrentChapter: (chapter: Chapter | null) => set({ currentChapter: chapter }),

  saveContent: async (id: string, content: string) => {
    const res = await chapterService.saveContent(id, content);
    if (res.code === 0) {
      const { chapters } = get();
      set({
        chapters: chapters.map(c => c.id === id ? res.data : c),
        currentChapter: res.data,
      });
    }
  },
}));