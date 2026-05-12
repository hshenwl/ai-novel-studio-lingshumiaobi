/**
 * 知识库核心接口定义
 * 所有实现必须遵循这些接口,支持本地/云端切换
 */

import {
  KnowledgeEntry,
  KnowledgeReference,
  ConstraintList,
  SearchRequest,
  SearchResult,
  IndexStatus,
  IndexConfig,
  KnowledgeVersion,
  CreationScene,
  KnowledgeCategory,
  KnowledgeSource,
  RecommendationResult
} from '../types';

/**
 * 知识库主接口
 * 所有知识库实现必须遵循此接口
 */
export interface IKnowledgeBase {
  // ============ 基础操作 ============

  /**
   * 初始化知识库
   */
  initialize(config: KnowledgeBaseConfig): Promise<void>;

  /**
   * 关闭知识库连接
   */
  close(): Promise<void>;

  /**
   * 获取知识库来源
   */
  getSource(): KnowledgeSource;

  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>;

  // ============ 条目管理 ============

  /**
   * 创建条目
   */
  createEntry(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeEntry>;

  /**
   * 批量创建条目
   */
  createEntries(entries: Array<Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<KnowledgeEntry[]>;

  /**
   * 获取条目
   */
  getEntry(id: string, tenantId: string): Promise<KnowledgeEntry | null>;

  /**
   * 批量获取条目
   */
  getEntries(ids: string[], tenantId: string): Promise<KnowledgeEntry[]>;

  /**
   * 更新条目
   */
  updateEntry(id: string, tenantId: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry>;

  /**
   * 删除条目
   */
  deleteEntry(id: string, tenantId: string): Promise<boolean>;

  /**
   * 按分类获取条目
   */
  getEntriesByCategory(
    category: KnowledgeCategory,
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KnowledgeEntry[]>;

  // ============ 检索功能 ============

  /**
   * 全文检索
   */
  search(request: SearchRequest): Promise<SearchResult>;

  /**
   * 向量检索(云端实现)
   */
  vectorSearch?(request: SearchRequest): Promise<SearchResult>;

  /**
   * 混合检索(FTS + Vector)
   */
  hybridSearch?(request: SearchRequest): Promise<SearchResult>;

  // ============ 索引管理 ============

  /**
   * 创建索引
   */
  createIndex(tenantId: string, categories?: KnowledgeCategory[]): Promise<void>;

  /**
   * 更新索引
   */
  updateIndex(tenantId: string, entryId: string): Promise<void>;

  /**
   * 重建索引
   */
  rebuildIndex(tenantId: string, categories?: KnowledgeCategory[]): Promise<void>;

  /**
   * 获取索引状态
   */
  getIndexStatus(tenantId: string, category: KnowledgeCategory): Promise<IndexStatus>;

  /**
   * 配置索引
   */
  configureIndex(config: IndexConfig): Promise<void>;

  // ============ 引用管理 ============

  /**
   * 记录引用
   */
  recordReference(reference: Omit<KnowledgeReference, 'id' | 'createdAt'>): Promise<KnowledgeReference>;

  /**
   * 获取引用历史
   */
  getReferenceHistory(
    nodeId: string,
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KnowledgeReference[]>;

  /**
   * 获取条目引用统计
   */
  getEntryReferenceStats(entryId: string, tenantId: string): Promise<ReferenceStats>;

  // ============ 约束清单 ============

  /**
   * 生成约束清单
   */
  generateConstraints(
    novelId: string,
    scene: CreationScene,
    tenantId: string,
    userId: string
  ): Promise<ConstraintList>;

  /**
   * 获取约束清单
   */
  getConstraintList(id: string, tenantId: string): Promise<ConstraintList | null>;

  /**
   * 更新约束状态
   */
  updateConstraintStatus(
    listId: string,
    constraintId: string,
    tenantId: string,
    updates: { applied?: boolean; violated?: boolean; violationNote?: string }
  ): Promise<void>;

  // ============ 版本管理 ============

  /**
   * 创建版本
   */
  createVersion(
    tenantId: string,
    userId: string,
    changes: Array<{ entryId: string; changeType: string; reason?: string }>
  ): Promise<KnowledgeVersion>;

  /**
   * 获取版本历史
   */
  getVersionHistory(
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KnowledgeVersion[]>;

  /**
   * 回滚到指定版本
   */
  rollbackToVersion(versionId: string, tenantId: string): Promise<void>;

  // ============ 场景推荐 ============

  /**
   * 获取场景推荐
   */
  getRecommendation(scene: CreationScene, tenantId: string): Promise<RecommendationResult>;
}

/**
 * 知识库配置
 */
export interface KnowledgeBaseConfig {
  tenantId: string;
  userId?: string;

  // 来源配置
  source: KnowledgeSource;

  // 本地配置
  local?: {
    dbPath?: string;
    knowledgeDir?: string;
    enableFTS: boolean;
    ftsTokenizer?: string;
  };

  // 云端配置
  cloud?: {
    apiEndpoint?: string;
    apiKey?: string;
    enableVector: boolean;
    embeddingModel?: string;
  };

  // 缓存配置
  cache?: {
    enabled: boolean;
    ttl?: number; // 秒
    maxSize?: number; // MB
  };
}

/**
 * 引用统计
 */
export interface ReferenceStats {
  entryId: string;
  totalReferences: number;
  recentReferences: number; // 最近7天
  topScenes: Array<{ scene: CreationScene; count: number }>;
  topNodes: Array<{ nodeId: string; nodeType: string; count: number }>;
}

/**
 * 知识库工厂接口
 */
export interface IKnowledgeBaseFactory {
  /**
   * 创建知识库实例
   */
  create(config: KnowledgeBaseConfig): IKnowledgeBase;

  /**
   * 获取默认知识库
   */
  getDefault(tenantId: string): IKnowledgeBase;
}

/**
 * 知识库提供者接口
 */
export interface IKnowledgeBaseProvider {
  /**
   * 注册知识库实现
   */
  register(source: KnowledgeSource, factory: IKnowledgeBaseFactory): void;

  /**
   * 获取知识库实例
   */
  get(config: KnowledgeBaseConfig): IKnowledgeBase;

  /**
   * 获取所有可用来源
   */
  getAvailableSources(): KnowledgeSource[];
}
