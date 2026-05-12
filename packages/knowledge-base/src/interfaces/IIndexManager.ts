/**
 * 索引管理接口
 */

import {
  KnowledgeCategory,
  IndexStatus,
  IndexConfig,
  IndexingStatus,
  KnowledgeEntry
} from '../types';

/**
 * 索引管理器接口
 */
export interface IIndexManager {
  /**
   * 初始化索引
   */
  initialize(tenantId: string, config: IndexConfig): Promise<void>;

  /**
   * 创建索引
   */
  createIndex(tenantId: string, category: KnowledgeCategory): Promise<void>;

  /**
   * 更新索引(单个条目)
   */
  updateIndex(tenantId: string, entry: KnowledgeEntry): Promise<void>;

  /**
   * 删除索引项
   */
  deleteIndex(tenantId: string, entryId: string): Promise<void>;

  /**
   * 重建索引
   */
  rebuildIndex(tenantId: string, category: KnowledgeCategory): Promise<void>;

  /**
   * 获取索引状态
   */
  getStatus(tenantId: string, category: KnowledgeCategory): Promise<IndexStatus>;

  /**
   * 获取所有索引状态
   */
  getAllStatus(tenantId: string): Promise<IndexStatus[]>;

  /**
   * 检查索引是否需要更新
   */
  needsReindex(tenantId: string, category: KnowledgeCategory): Promise<boolean>;

  /**
   * 优化索引
   */
  optimize(tenantId: string): Promise<void>;

  /**
   * 关闭索引
   */
  close(): Promise<void>;
}

/**
 * FTS索引接口
 */
export interface IFTSIndex {
  /**
   * 创建FTS索引
   */
  createFTS(tenantId: string, category: KnowledgeCategory): Promise<void>;

  /**
   * 插入FTS文档
   */
  insertDocument(entry: KnowledgeEntry): Promise<void>;

  /**
   * 更新FTS文档
   */
  updateDocument(entry: KnowledgeEntry): Promise<void>;

  /**
   * 删除FTS文档
   */
  deleteDocument(entryId: string, tenantId: string): Promise<void>;

  /**
   * 搜索
   */
  search(
    query: string,
    tenantId: string,
    options?: {
      categories?: KnowledgeCategory[];
      limit?: number;
      offset?: number;
    }
  ): Promise<Array<{ entryId: string; score: number; highlights: string[] }>>;
}

/**
 * 向量索引接口(云端预留)
 */
export interface IVectorIndex {
  /**
   * 初始化向量索引
   */
  initialize(config: VectorIndexConfig): Promise<void>;

  /**
   * 创建向量嵌入
   */
  createEmbedding(text: string): Promise<number[]>;

  /**
   * 批量创建嵌入
   */
  createEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * 插入向量
   */
  insertVector(entry: KnowledgeEntry, embedding: number[]): Promise<void>;

  /**
   * 向量搜索
   */
  search(
    query: string,
    tenantId: string,
    options?: {
      categories?: KnowledgeCategory[];
      limit?: number;
      threshold?: number;
    }
  ): Promise<Array<{ entryId: string; score: number }>>;
}

/**
 * 向量索引配置
 */
export interface VectorIndexConfig {
  tenantId: string;
  dimension: number;
  metric: VectorMetric;
  embeddingModel: string;
  apiEndpoint?: string;
  apiKey?: string;
}

/**
 * 向量距离度量
 */
export enum VectorMetric {
  COSINE = 'cosine',
  EUCLIDEAN = 'euclidean',
  DOT_PRODUCT = 'dot_product'
}
