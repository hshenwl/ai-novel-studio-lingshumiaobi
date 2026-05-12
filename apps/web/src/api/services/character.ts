import { apiClient } from '../client';
import { Character, PageResponse, PageRequest } from '../types';

const BASE_URL = '/characters';

export const characterService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Character>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Character>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Character>) => {
    return apiClient.post<Character>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<Character>) => {
    return apiClient.put<Character>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getByRole: async (projectId: string, role: string) => {
    return apiClient.get<Character[]>(`${BASE_URL}/role/${role}`, {
      params: { projectId }
    });
  },

  search: async (projectId: string, keyword: string) => {
    return apiClient.get<Character[]>(`${BASE_URL}/search`, {
      params: { projectId, keyword }
    });
  },

  getRelations: async (id: string) => {
    return apiClient.get<Character['relationships']>(`${BASE_URL}/${id}/relations`);
  },

  addRelation: async (id: string, relation: { characterId: string; relationship: string; description: string }) => {
    return apiClient.post<void>(`${BASE_URL}/${id}/relations`, relation);
  },

  removeRelation: async (id: string, relationId: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}/relations/${relationId}`);
  },
};