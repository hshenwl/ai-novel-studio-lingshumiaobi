import { apiClient } from '../client';
import { Chapter, PageResponse, PageRequest } from '../types';

const BASE_URL = '/chapters';

export const chapterService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Chapter>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Chapter>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Chapter>) => {
    return apiClient.post<Chapter>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<Chapter>) => {
    return apiClient.put<Chapter>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getContent: async (id: string) => {
    return apiClient.get<{ content: string; wordCount: number }>(`${BASE_URL}/${id}/content`);
  },

  saveContent: async (id: string, content: string) => {
    return apiClient.put<Chapter>(`${BASE_URL}/${id}/content`, { content });
  },

  getVersions: async (id: string) => {
    return apiClient.get<{ version: number; content: string; createdAt: string }[]>(`${BASE_URL}/${id}/versions`);
  },

  restoreVersion: async (id: string, version: number) => {
    return apiClient.post<Chapter>(`${BASE_URL}/${id}/restore`, { version });
  },

  generateContent: async (id: string) => {
    return apiClient.post<Chapter>(`${BASE_URL}/${id}/generate`);
  },
};