import { apiClient } from '../client';
import { Hook, PageResponse, PageRequest } from '../types';

const BASE_URL = '/hooks';

export const hookService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Hook>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Hook>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Hook>) => {
    return apiClient.post<Hook>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<Hook>) => {
    return apiClient.put<Hook>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getByChapter: async (chapterId: string) => {
    return apiClient.get<Hook[]>(`${BASE_URL}/chapter/${chapterId}`);
  },

  getByType: async (projectId: string, type: string) => {
    return apiClient.get<Hook[]>(`${BASE_URL}/type/${type}`, {
      params: { projectId }
    });
  },

  markResolved: async (id: string) => {
    return apiClient.post<void>(`${BASE_URL}/${id}/resolve`);
  },

  getTimeline: async (projectId: string) => {
    return apiClient.get<Hook[]>(`${BASE_URL}/timeline`, {
      params: { projectId }
    });
  },

  analyzeIntensity: async (projectId: string) => {
    return apiClient.get<{ chapterId: string; averageIntensity: number }[]>(`${BASE_URL}/analyze`, {
      params: { projectId }
    });
  },
};