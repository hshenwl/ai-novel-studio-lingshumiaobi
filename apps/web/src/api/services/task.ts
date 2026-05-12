import { apiClient } from '../client';
import { Task, PageResponse, PageRequest } from '../types';

const BASE_URL = '/tasks';

export const taskService = {
  getList: async (projectId: string, params?: PageRequest & { status?: string; type?: string }) => {
    return apiClient.get<PageResponse<Task>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Task>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Task>) => {
    return apiClient.post<Task>(BASE_URL, data);
  },

  cancel: async (id: string) => {
    return apiClient.post<Task>(`${BASE_URL}/${id}/cancel`);
  },

  retry: async (id: string) => {
    return apiClient.post<Task>(`${BASE_URL}/${id}/retry`);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getRunning: async (projectId: string) => {
    return apiClient.get<Task[]>(`${BASE_URL}/running`, {
      params: { projectId }
    });
  },

  getStats: async (projectId: string) => {
    return apiClient.get<{
      total: number;
      pending: number;
      running: number;
      completed: number;
      failed: number;
    }>(`${BASE_URL}/stats`, {
      params: { projectId }
    });
  },
};