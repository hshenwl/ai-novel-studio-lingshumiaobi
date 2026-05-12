import { apiClient } from '../client';
import { Log, PageResponse, PageRequest } from '../types';

const BASE_URL = '/logs';

export const logService = {
  getList: async (projectId: string, params?: PageRequest & { level?: string; category?: string }) => {
    return apiClient.get<PageResponse<Log>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Log>(`${BASE_URL}/${id}`);
  },

  getRecent: async (projectId: string, limit?: number) => {
    return apiClient.get<Log[]>(`${BASE_URL}/recent`, {
      params: { projectId, limit }
    });
  },

  getByLevel: async (projectId: string, level: string) => {
    return apiClient.get<Log[]>(`${BASE_URL}/level/${level}`, {
      params: { projectId }
    });
  },

  clear: async (projectId: string) => {
    return apiClient.delete<void>(`${BASE_URL}/clear`, {
      params: { projectId }
    });
  },

  export: async (projectId: string, startDate?: string, endDate?: string) => {
    return apiClient.get<Blob>(`${BASE_URL}/export`, {
      params: { projectId, startDate, endDate },
      responseType: 'blob'
    });
  },
};