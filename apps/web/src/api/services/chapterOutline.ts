import { apiClient } from '../client';
import { ChapterOutline, PageResponse, PageRequest } from '../types';

const BASE_URL = '/chapter-outline';

export const chapterOutlineService = {
  getList: async (projectId: string, volumeId?: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<ChapterOutline>>(BASE_URL, { 
      params: { projectId, volumeId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<ChapterOutline>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<ChapterOutline>) => {
    return apiClient.post<ChapterOutline>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<ChapterOutline>) => {
    return apiClient.put<ChapterOutline>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  batchCreate: async (volumeId: string, count: number) => {
    return apiClient.post<ChapterOutline[]>(`${BASE_URL}/batch`, { volumeId, count });
  },

  generateSynopsis: async (id: string) => {
    return apiClient.post<ChapterOutline>(`${BASE_URL}/${id}/generate-synopsis`);
  },
};