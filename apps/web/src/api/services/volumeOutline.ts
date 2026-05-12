import { apiClient } from '../client';
import { VolumeOutline, PageResponse, PageRequest } from '../types';

const BASE_URL = '/volume-outline';

export const volumeOutlineService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<VolumeOutline>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<VolumeOutline>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<VolumeOutline>) => {
    return apiClient.post<VolumeOutline>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<VolumeOutline>) => {
    return apiClient.put<VolumeOutline>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  reorder: async (projectId: string, volumeIds: string[]) => {
    return apiClient.post<void>(`${BASE_URL}/reorder`, { projectId, volumeIds });
  },
};