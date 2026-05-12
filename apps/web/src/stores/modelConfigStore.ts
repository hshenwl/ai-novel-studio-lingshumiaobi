import { create } from 'zustand';
import { ModelConfig } from '../api/types';
import { modelConfigService } from '../api/services/modelConfig';

interface ModelConfigState {
  models: ModelConfig[];
  currentModel: ModelConfig | null;
  loading: boolean;
  fetchList: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<ModelConfig>) => Promise<void>;
  update: (id: string, data: Partial<ModelConfig>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  toggle: (id: string, enabled: boolean) => Promise<void>;
}

export const useModelConfigStore = create<ModelConfigState>((set, get) => ({
  models: [],
  currentModel: null,
  loading: false,

  fetchList: async () => {
    set({ loading: true });
    try {
      const res = await modelConfigService.getList({ page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ models: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await modelConfigService.getById(id);
      if (res.code === 0) {
        set({ currentModel: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<ModelConfig>) => {
    const res = await modelConfigService.create(data);
    if (res.code === 0) {
      const { models } = get();
      set({ models: [...models, res.data] });
    }
  },

  update: async (id: string, data: Partial<ModelConfig>) => {
    const res = await modelConfigService.update(id, data);
    if (res.code === 0) {
      const { models } = get();
      set({
        models: models.map(m => m.id === id ? res.data : m),
        currentModel: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await modelConfigService.delete(id);
    const { models } = get();
    set({ models: models.filter(m => m.id !== id) });
  },

  toggle: async (id: string, enabled: boolean) => {
    const res = await modelConfigService.toggle(id, enabled);
    if (res.code === 0) {
      const { models } = get();
      set({
        models: models.map(m => m.id === id ? res.data : m),
      });
    }
  },
}));