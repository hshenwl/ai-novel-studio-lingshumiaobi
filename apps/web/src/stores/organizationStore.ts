import { create } from 'zustand';
import { Organization } from '../api/types';
import { organizationService } from '../api/services/organization';

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: Partial<Organization>) => Promise<void>;
  update: (id: string, data: Partial<Organization>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setCurrentOrganization: (organization: Organization | null) => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organizations: [],
  currentOrganization: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await organizationService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ organizations: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await organizationService.getById(id);
      if (res.code === 0) {
        set({ currentOrganization: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (data: Partial<Organization>) => {
    const res = await organizationService.create(data);
    if (res.code === 0) {
      const { organizations } = get();
      set({ organizations: [...organizations, res.data] });
    }
  },

  update: async (id: string, data: Partial<Organization>) => {
    const res = await organizationService.update(id, data);
    if (res.code === 0) {
      const { organizations } = get();
      set({
        organizations: organizations.map(o => o.id === id ? res.data : o),
        currentOrganization: res.data,
      });
    }
  },

  delete: async (id: string) => {
    await organizationService.delete(id);
    const { organizations } = get();
    set({ organizations: organizations.filter(o => o.id !== id) });
  },

  setCurrentOrganization: (organization: Organization | null) => set({ currentOrganization: organization }),
}));