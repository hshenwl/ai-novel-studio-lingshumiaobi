import { apiClient } from '../client';
import { NovelOutline } from '../types';

const BASE_URL = '/novel-outline';

export const novelOutlineService = {
  getByProject: async (projectId: string) => {
    return apiClient.get<NovelOutline>(`${BASE_URL}/project/${projectId}`);
  },

  getById: async (id: string) => {
    return apiClient.get<NovelOutline>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<NovelOutline>) => {
    return apiClient.post<NovelOutline>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<NovelOutline>) => {
    return apiClient.put<NovelOutline>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  generateOutline: async (projectId: string) => {
    return apiClient.post<NovelOutline>(`${BASE_URL}/generate`, { projectId });
  },
};