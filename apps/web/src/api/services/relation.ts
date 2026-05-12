import { apiClient } from '../client';
import { RelationGraph } from '../types';

const BASE_URL = '/relations';

export const relationService = {
  getGraph: async (projectId: string) => {
    return apiClient.get<RelationGraph>(`${BASE_URL}/graph`, {
      params: { projectId }
    });
  },

  addNode: async (projectId: string, node: { name: string; type: 'character' | 'organization' }) => {
    return apiClient.post<void>(`${BASE_URL}/nodes`, { projectId, ...node });
  },

  removeNode: async (nodeId: string) => {
    return apiClient.delete<void>(`${BASE_URL}/nodes/${nodeId}`);
  },

  addEdge: async (projectId: string, edge: { source: string; target: string; relationship: string; description: string }) => {
    return apiClient.post<void>(`${BASE_URL}/edges`, { projectId, ...edge });
  },

  removeEdge: async (edgeId: string) => {
    return apiClient.delete<void>(`${BASE_URL}/edges/${edgeId}`);
  },

  getCharacterRelations: async (characterId: string) => {
    return apiClient.get<RelationGraph>(`${BASE_URL}/character/${characterId}`);
  },
};