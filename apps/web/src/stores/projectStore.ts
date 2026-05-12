import { create } from 'zustand';
import { Project } from '../api/types';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],
  loading: false,
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
}));