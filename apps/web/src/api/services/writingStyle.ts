import { apiClient } from '../client';
import { WritingStyle } from '../types';

const BASE_URL = '/writing-style';

export const writingStyleService = {
  getByProject: async (projectId: string) => {
    return apiClient.get<WritingStyle>(`${BASE_URL}/project/${projectId}`);
  },

  getById: async (id: string) => {
    return apiClient.get<WritingStyle>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<WritingStyle>) => {
    return apiClient.post<WritingStyle>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<WritingStyle>) => {
    return apiClient.put<WritingStyle>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  analyzeSample: async (text: string) => {
    return apiClient.post<Partial<WritingStyle>>(`${BASE_URL}/analyze`, { text });
  },

  applyStyle: async (text: string, styleId: string) => {
    return apiClient.post<{ text: string }>(`${BASE_URL}/apply`, { text, styleId });
  },
};