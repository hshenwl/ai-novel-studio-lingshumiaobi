import { apiClient } from '../client';
import { KnowledgeItem, PageResponse, PageRequest } from '../types';

const BASE_URL = '/knowledge-base';

export const knowledgeBaseService = {
  getList: async (projectId: string, params?: PageRequest) => {
    return apiClient.get<PageResponse<KnowledgeItem>>(BASE_URL, { 
      params: { projectId, ...params } 
    });
  },

  getById: async (id: string) => {
    return apiClient.get<KnowledgeItem>(`${BASE_URL}/${id}`);
  },

  create: async (data: Partial<KnowledgeItem>) => {
    return apiClient.post<KnowledgeItem>(BASE_URL, data);
  },

  update: async (id: string, data: Partial<KnowledgeItem>) => {
    return apiClient.put<KnowledgeItem>(`${BASE_URL}/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  getByCategory: async (projectId: string, category: string) => {
    return apiClient.get<KnowledgeItem[]>(`${BASE_URL}/category/${category}`, {
      params: { projectId }
    });
  },

  search: async (projectId: string, keyword: string) => {
    return apiClient.get<KnowledgeItem[]>(`${BASE_URL}/search`, {
      params: { projectId, keyword }
    });
  },

  getCategories: async (projectId: string) => {
    return apiClient.get<{ name: string; count: number }[]>(`${BASE_URL}/categories`, {
      params: { projectId }
    });
  },

  import: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<KnowledgeItem[]>(`${BASE_URL}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { projectId }
    });
  },

  export: async (projectId: string) => {
    return apiClient.get<Blob>(`${BASE_URL}/export`, {
      params: { projectId },
      responseType: 'blob'
    });
  },
};