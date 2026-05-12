import { apiClient } from '../client';
import {
  Project,
  CreateProjectRequest,
  PageResponse,
  PageRequest,
} from '../types';

const BASE_URL = '/projects';

export const projectService = {
  // 获取项目列表
  getList: async (params: PageRequest) => {
    return apiClient.get<PageResponse<Project>>(BASE_URL, { params });
  },

  // 获取项目详情
  getById: async (id: string) => {
    return apiClient.get<Project>(`${BASE_URL}/${id}`);
  },

  // 创建项目
  create: async (data: CreateProjectRequest) => {
    return apiClient.post<Project>(BASE_URL, data);
  },

  // 更新项目
  update: async (id: string, data: Partial<Project>) => {
    return apiClient.put<Project>(`${BASE_URL}/${id}`, data);
  },

  // 删除项目
  delete: async (id: string) => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  // 导出项目
  export: async (id: string) => {
    return apiClient.get<Blob>(`${BASE_URL}/${id}/export`, {
      responseType: 'blob',
    });
  },

  // 导入项目
  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<Project>(`${BASE_URL}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};