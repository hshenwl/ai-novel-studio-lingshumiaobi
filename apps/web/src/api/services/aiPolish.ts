import { apiClient } from '../client';
import { AIPolishConfig, PolishRule, PageResponse, PageRequest } from '../types';

const BASE_URL = '/ai-polish';

export const aiPolishService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<AIPolishConfig>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<AIPolishConfig>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<AIPolishConfig>) => {
    return apiClient.post<AIPolishConfig>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<AIPolishConfig>) => {
    return apiClient.put<AIPolishConfig>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getRules: async (configId: string) => {
    return apiClient.get<PolishRule[]>(`${BASE_URL}/${configId}/rules`);
  },

  addRule: async (configId: string, rule: Partial<PolishRule>) => {
    return apiClient.post<PolishRule>(`${BASE_URL}/${configId}/rules`, rule);
  },

  updateRule: async (configId: string, ruleId: string, data: Partial<PolishRule>) => {
    return apiClient.put<PolishRule>(`${BASE_URL}/${configId}/rules/${ruleId}`, data);
  },

  deleteRule: async (configId: string, ruleId: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${configId}/rules/${ruleId}`);
  },

  polishText: async (configId: string, text: string) => {
    return apiClient.post<{ original: string; polished: string; changes: { pattern: string; replacement: string; count: number }[] }>(
      `${BASE_URL}/${configId}/polish`, 
      { text }
    );
  },

  getDefaultModes: async () => {
    return apiClient.get<{ id: string; name: string; description: string; rules: number }[]>(`${BASE_URL}/default-modes`);
  },
};