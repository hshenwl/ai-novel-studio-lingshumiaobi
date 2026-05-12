import { create } from 'zustand';
import { Character } from '../api/types';
import { characterService } from '../api/services/character';

interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<Character>) => Promise<void>;
  update: (id: string, data: Partial<Character>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  currentCharacter: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await characterService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ characters: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await characterService.getById(id);
      if (res.code === 0) {
        set({ currentCharacter: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<Character>) => {
    const res = await characterService.create(data);
    if (res.code === 0) {
      const { characters } = get();
      set({ characters: [...characters, res.data] });
    }
  },

  update: async (id: string, data: Partial<Character>) => {
    const res = await characterService.update(id, data);
    if (res.code === 0) {
      const { characters } = get();
      set({
        characters: characters.map(c => c.id === id ? res.data : c),
        currentCharacter: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await characterService.delete(id);
    const { characters } = get();
    set({ characters: characters.filter(c => c.id !== id) });
  },

  setCurrentCharacter: (character: Character | null) => set({ currentCharacter: character }),
}));