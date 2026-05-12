import { apiClient } from '../client';
import { Workflow, PageResponse, PageRequest } from '../types';

const BASE_URL = '/workflow';

export const workflowService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Workflow>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Workflow>(`${BASE_URL}/${id}`);
  },

  getCurrent: async (projectId: string) => {
    return apiClient.get<Workflow | null>(`${BASE_URL}/current`, {
      params: { projectId }
    });
  },

  create: async (projectId: string, name: string, steps: Omit<Workflow['steps'][0], 'id' | 'status' | 'progress' | 'result' | 'error' | 'startedAt' | 'completedAt'>[]) => {
    return apiClient.post<Workflow>(BASE_URL, { projectId, name, steps });
  },

  start: async (id: string) => {
    return apiClient.post<Workflow>(`${BASE_URL}/${id}/start`);
  },

  pause: async (id: string) => {
    return apiClient.post<Workflow>(`${BASE_URL}/${id}/pause`);
  },

  resume: async (id: string) => {
    return apiClient.post<Workflow>(`${BASE_URL}/${id}/resume`);
  },

  cancel: async (id: string) => {
    return apiClient.post<Workflow>(`${BASE_URL}/${id}/cancel`);
  },

  retry: async (id: string, stepId: string) => {
    return apiClient.post<Workflow>(`${BASE_URL}/${id}/retry`, { stepId });
  },

  skip: async (id: string, stepId: string) => {
    return apiClient.post<Workflow>(`${BASE_URL}/${id}/skip`, { stepId });
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getHistory: async (projectId: string) => {
    return apiClient.get<Workflow[]>(`${BASE_URL}/history`, {
      params: { projectId }
    });
  },
};