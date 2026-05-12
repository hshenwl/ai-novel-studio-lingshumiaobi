import { apiClient } from '../client';
import { WorldBuilding, PageResponse, PageRequest } from '../types';

const BASE_URL = '/world-building';

export const worldBuildingService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<WorldBuilding>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<WorldBuilding>(`${BASE_URL}/${id}`);
  },

  getByCategory: async (projectId: string, category: string) => {
    return apiClient.get<WorldBuilding[]>(`${BASE_URL}/category/${category}`, {
      params: { projectId }
    });
  },

  create: async (data: Partial<WorldBuilding>) => {
    return apiClient.post<WorldBuilding>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<WorldBuilding>) => {
    return apiClient.put<WorldBuilding>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  search: async (projectId: string, keyword: string) => {
    return apiClient.get<WorldBuilding[]>(`${BASE_URL}/search`, {
      params: { projectId, keyword }
    });
  },
};