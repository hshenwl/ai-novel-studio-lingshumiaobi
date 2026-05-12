import { create } from 'zustand';
import { Workflow } from '../api/types';
import { workflowService } from '../api/services/workflow';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  fetchList: (projectId: string) => Promise<void>;
  fetchCurrent: (projectId: string) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (projectId: string, name: string, steps: any[]) => Promise<void>;
  start: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  loading: false,

  fetchList: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await workflowService.getList(projectId, { page: 1, pageSize: 100 });
      if (res.code === 0) {
        set({ workflows: res.data.list });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchCurrent: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await workflowService.getCurrent(projectId);
      if (res.code === 0) {
        set({ currentWorkflow: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await workflowService.getById(id);
      if (res.code === 0) {
        set({ currentWorkflow: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (projectId: string, name: string, steps: any[]) => {
    const res = await workflowService.create(projectId, name, steps);
    if (res.code === 0) {
      const { workflows } = get();
      set({ workflows: [...workflows, res.data], currentWorkflow: res.data });
    }
  },

  start: async (id: string) => {
    const res = await workflowService.start(id);
    if (res.code === 0) {
      set({ currentWorkflow: res.data });
    }
  },

  pause: async (id: string) => {
    const res = await workflowService.pause(id);
    if (res.code === 0) {
      set({ currentWorkflow: res.data });
    }
  },

  resume: async (id: string) => {
    const res = await workflowService.resume(id);
    if (res.code === 0) {
      set({ currentWorkflow: res.data });
    }
  },

  cancel: async (id: string) => {
    const res = await workflowService.cancel(id);
    if (res.code === 0) {
      set({ currentWorkflow: res.data });
    }
  },

  delete: async (id: string) => {
    await workflowService.delete(id);
    const { workflows } = get();
    set({ workflows: workflows.filter(w => w.id !== id) });
  },
}));