import { create } from 'zustand';
import { VolumeOutline } from '../api/types';
import { volumeOutlineService } from '../api/services/volumeOutline';

interface VolumeOutlineState {
  volumes: VolumeOutline[];
  currentVolume: VolumeOutline | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<VolumeOutline>) => Promise<void>;
  update: (id: string, data: Partial<VolumeOutline>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentVolume: (volume: VolumeOutline | null) => void;
}

export const useVolumeOutlineStore = create<VolumeOutlineState>((set, get) => ({
  volumes: [],
  currentVolume: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await volumeOutlineService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ volumes: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await volumeOutlineService.getById(id);
      if (res.code === 0) {
        set({ currentVolume: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<VolumeOutline>) => {
    const res = await volumeOutlineService.create(data);
    if (res.code === 0) {
      const { volumes } = get();
      set({ volumes: [...volumes, res.data] });
    }
  },

  update: async (id: string, data: Partial<VolumeOutline>) => {
    const res = await volumeOutlineService.update(id, data);
    if (res.code === 0) {
      const { volumes } = get();
      set({
        volumes: volumes.map(v => v.id === id ? res.data : v),
        currentVolume: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await volumeOutlineService.delete(id);
    const { volumes } = get();
    set({ volumes: volumes.filter(v => v.id !== id) });
  },

  setCurrentVolume: (volume: VolumeOutline | null) => set({ currentVolume: volume }),
}));