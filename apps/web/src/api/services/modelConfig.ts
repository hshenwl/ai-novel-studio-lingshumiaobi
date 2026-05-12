import { apiClient } from '../client';
import { ModelConfig, PageResponse, PageRequest } from '../types';

const BASE_URL = '/model-config';

export const modelConfigService = {
  getList: async (params?: PageRequest) => {
    return apiClient.get<PageResponse<ModelConfig>>(BASE_URL, { params });
  },

  getById: async (id: string) => {
    return apiClient.get<ModelConfig>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<ModelConfig>) => {
    return apiClient.post<ModelConfig>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<ModelConfig>) => {
    return apiClient.put<ModelConfig>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  toggle: async (id: string, enabled: boolean) => {
    return apiClient.put<ModelConfig>(`${BASE_URL}/${id}/toggle`, { enabled });
  },

  test: async (id: string) => {
    return apiClient.post<{ success: boolean; message: string; latency: number }>(`${BASE_URL}/${id}/test`);
  },

  getRoutingStrategy: async () => {
    return apiClient.get<{ defaultModel: string; taskModels: { task: string; model: string }[] }>(`${BASE_URL}/routing`);
  },

  updateRoutingStrategy: async (data: { defaultModel: string; taskModels: { task: string; model: string }[] }) => {
    return apiClient.put<void>(`${BASE_URL}/routing`, data);
  },

  getCostStats: async (startDate?: string, endDate?: string) => {
    return apiClient.get<{
      totalCost: number;
      totalTokens: number;
      models: { name: string; calls: number; tokens: number; cost: number }[];
    }>(`${BASE_URL}/cost-stats`, {
      params: { startDate, endDate }
    });
  },
};