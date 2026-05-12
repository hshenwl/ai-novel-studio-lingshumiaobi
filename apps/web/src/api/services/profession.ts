import { apiClient } from '../client';
import { Profession, PageResponse, PageRequest } from '../types';

const BASE_URL = '/professions';

export const professionService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Profession>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Profession>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Profession>) => {
    return apiClient.post<Profession>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<Profession>) => {
    return apiClient.put<Profession>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getByCategory: async (projectId: string, category: string) => {
    return apiClient.get<Profession[]>(`${BASE_URL}/category/${category}`, {
      params: { projectId }
    });
  },
};