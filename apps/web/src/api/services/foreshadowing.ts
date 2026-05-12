import { apiClient } from '../client';
import { Foreshadowing, PageResponse, PageRequest } from '../types';

const BASE_URL = '/foreshadowing';

export const foreshadowingService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Foreshadowing>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Foreshadowing>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Foreshadowing>) => {
    return apiClient.post<Foreshadowing>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<Foreshadowing>) => {
    return apiClient.put<Foreshadowing>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getByStatus: async (projectId: string, status: string) => {
    return apiClient.get<Foreshadowing[]>(`${BASE_URL}/status/${status}`, {
      params: { projectId }
    });
  },

  markAsPlanted: async (id: string, chapterId: string) => {
    return apiClient.post<void>(`${BASE_URL}/${id}/plant`, { chapterId });
  },

  markAsPaidoff: async (id: string, chapterId: string) => {
    return apiClient.post<void>(`${BASE_URL}/${id}/payoff`, { chapterId });
  },

  getTimeline: async (projectId: string) => {
    return apiClient.get<Foreshadowing[]>(`${BASE_URL}/timeline`, {
      params: { projectId }
    });
  },
};