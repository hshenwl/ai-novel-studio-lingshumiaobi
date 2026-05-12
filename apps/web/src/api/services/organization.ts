import { apiClient } from '../client';
import { Organization, PageResponse, PageRequest } from '../types';

const BASE_URL = '/organizations';

export const organizationService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<Organization>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Organization>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<Organization>) => {
    return apiClient.post<Organization>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<Organization>) => {
    return apiClient.put<Organization>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getByType: async (projectId: string, type: string) => {
    return apiClient.get<Organization[]>(`${BASE_URL}/type/${type}`, {
      params: { projectId }
    });
  },

  getMembers: async (id: string) => {
    return apiClient.get<{ characterId: string; characterName: string; role: string }[]>(`${BASE_URL}/${id}/members`);
  },

  addMember: async (id: string, characterId: string, role: string) => {
    return apiClient.post<void>(`${BASE_URL}/${id}/members`, { characterId, role });
  },

  removeMember: async (id: string, characterId: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}/members/${characterId}`);
  },
};