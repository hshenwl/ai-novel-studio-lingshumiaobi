/**
 * 知识库核心类型定义
 * 支持本地优先、云端兼容的架构设计
 */

// ============ 基础类型 ============

/**
 * 知识库条目分类
 */
export enum KnowledgeCategory {
  TUTORIALS = 'tutorials',      // 写作教程
  TECHNIQUES = 'techniques',    // 技法与大纲
  PLOTS = 'plots',              // 剧情参考资料
  CHARACTERS = 'characters',    // 人物描写素材
  WORLD = 'world',              // 世界观与设定
  SCENES = 'scenes',            // 场景写法
  REFERENCE = 'reference',      // 阅读与拆解
  OPERATIONS = 'operations',    // 运营与文案
  CASE_STUDIES = 'case_studies', // 案例分析
  CONCEPTS = 'concepts',        // 核心写作概念
  ENTITIES = 'entities'         // 实体定义
}

/**
 * 创作场景枚举
 */
export enum CreationScene {
  WORLD_SETTING = 'world_setting',           // 世界设定
  VOLUME_OUTLINE = 'volume_outline',         // 卷纲生成
  CHAPTER_OUTLINE = 'chapter_outline',       // 章纲生成
  CONTENT_GENERATION = 'content_generation', // 正文生成
  CHARACTER_BUILDING = 'character_building', // 人物塑造
  FORESHADOWING = 'foreshadowing',           // 伏笔设计
  HIGHLIGHT_DESIGN = 'highlight_design',     // 爽点设计
  AI_DETOX = 'ai_detox',                     // AI去味
  AUDIT = 'audit'                            // 审核
}

/**
 * 检索模式
 */
export enum SearchMode {
  FTS = 'fts',           // 全文检索
  VECTOR = 'vector',     // 向量检索
  HYBRID = 'hybrid'      // 混合检索
}

/**
 * 知识库来源
 */
export enum KnowledgeSource {
  LOCAL = 'local',       // 本地SQLite
  CLOUD = 'cloud',       // 云端API
  HYBRID = 'hybrid'      // 混合模式
}

// ============ 核心实体 ============

/**
 * 知识库条目
 */
export interface KnowledgeEntry {
  id: string;
  tenantId: string;
  userId: string;

  // 分类信息
  category: KnowledgeCategory;
  subCategory?: string;
  tags: string[];

  // 内容
  title: string;
  content: string;
  summary?: string;

  // 元数据
  source?: string;
  author?: string;
  version: number;

  // 向量嵌入(云端预留)
  embedding?: number[];

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  indexedAt?: Date;

  // 状态
  status: EntryStatus;
}

/**
 * 条目状态
 */
export enum EntryStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated'
}

/**
 * 知识库引用记录
 */
export interface KnowledgeReference {
  id: string;
  tenantId: string;
  userId: string;

  // 引用来源
  entryId: string;
  entryTitle: string;
  category: KnowledgeCategory;

  // 引用上下文
  context: ReferenceContext;
  nodeId: string;           // 节点ID(如章节ID、人物ID)
  nodeType: string;         // 节点类型(chapter/character/plot)

  // 引用片段
  quotedText?: string;      // 引用的具体内容片段
  appliedConstraint?: string; // 应用的约束内容

  // 时间戳
  createdAt: Date;
  createdBy: string;
}

/**
 * 引用上下文
 */
export interface ReferenceContext {
  scene: CreationScene;     // 创作场景
  phase: CreationPhase;     // 创作阶段
  action: string;           // 具体动作(planning/writing/auditing等)
}

/**
 * 创作阶段
 */
export enum CreationPhase {
  PLANNING = 'planning',     // 规划阶段(Planner)
  WRITING = 'writing',       // 写作阶段(Writer)
  AUDITING = 'auditing',     // 审核阶段(Auditor)
  REVISING = 'revising',     // 修订阶段(Reviser)
  SETTLING = 'settling'      // 结算阶段(Settler)
}

/**
 * 约束清单
 */
export interface ConstraintList {
  id: string;
  tenantId: string;
  userId: string;

  // 关联信息
  novelId: string;
  scene: CreationScene;
  phase: CreationPhase;

  // 约束内容
  constraints: ConstraintItem[];

  // 状态
  status: ConstraintStatus;
  appliedAt?: Date;
  verifiedAt?: Date;

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 约束项
 */
export interface ConstraintItem {
  id: string;
  entryId: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  priority: ConstraintPriority;
  type: ConstraintType;

  // 来源信息
  sourceFile?: string;
  sourceSection?: string;

  // 应用状态
  applied: boolean;
  violated: boolean;
  violationNote?: string;
}

/**
 * 约束优先级
 */
export enum ConstraintPriority {
  CRITICAL = 'critical',   // 必须遵守
  HIGH = 'high',           // 强烈建议
  MEDIUM = 'medium',       // 一般建议
  LOW = 'low'              // 可选参考
}

/**
 * 约束类型
 */
export enum ConstraintType {
  SETTING = 'setting',         // 设定约束(世界观、力量体系)
  CHARACTER = 'character',     // 人物约束(性格、行为)
  PLOT = 'plot',               // 剧情约束(伏笔、节奏)
  STYLE = 'style',             // 风格约束(文笔、对话)
  TECHNIQUE = 'technique',     // 技法约束(写作技巧)
  BUSINESS = 'business'        // 商业约束(平台规则、爽点)
}

// ============ 检索相关 ============

/**
 * 检索请求
 */
export interface SearchRequest {
  tenantId: string;
  userId: string;

  // 检索参数
  query: string;
  categories?: KnowledgeCategory[];
  tags?: string[];
  mode: SearchMode;

  // 分页
  limit?: number;
  offset?: number;

  // 过滤
  filters?: SearchFilter[];

  // 排序
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

/**
 * 检索过滤器
 */
export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

/**
 * 过滤操作符
 */
export enum FilterOperator {
  EQ = 'eq',
  NE = 'ne',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  LIKE = 'like',
  CONTAINS = 'contains'
}

/**
 * 排序字段
 */
export enum SortField {
  RELEVANCE = 'relevance',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  TITLE = 'title',
  CATEGORY = 'category'
}

/**
 * 排序顺序
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 检索结果
 */
export interface SearchResult {
  entries: SearchResultEntry[];
  total: number;
  hasMore: boolean;
  query: string;
  mode: SearchMode;
  executionTime: number; // ms
}

/**
 * 检索结果条目
 */
export interface SearchResultEntry extends KnowledgeEntry {
  score: number;           // 相关性得分
  highlights?: string[];   // 高亮片段
  matchedFields?: string[]; // 匹配的字段
}

// ============ 索引相关 ============

/**
 * 索引状态
 */
export interface IndexStatus {
  tenantId: string;
  category: KnowledgeCategory;

  // 统计
  totalEntries: number;
  indexedEntries: number;
  pendingEntries: number;

  // 状态
  status: IndexingStatus;
  lastIndexedAt?: Date;
  error?: string;

  // 进度
  progress?: number; // 0-100
}

/**
 * 索引状态枚举
 */
export enum IndexingStatus {
  IDLE = 'idle',
  INDEXING = 'indexing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 索引配置
 */
export interface IndexConfig {
  tenantId: string;
  categories: KnowledgeCategory[];

  // FTS配置
  enableFTS: boolean;
  ftsTokenizer?: string;

  // 向量配置(云端预留)
  enableVector: boolean;
  vectorDimension?: number;
  embeddingModel?: string;

  // 更新策略
  autoReindex: boolean;
  reindexInterval?: number; // 小时
}

// ============ 版本管理 ============

/**
 * 版本信息
 */
export interface KnowledgeVersion {
  id: string;
  tenantId: string;
  userId: string;

  // 版本号
  version: string;
  versionCode: number;

  // 变更信息
  changes: VersionChange[];
  changeSummary: string;

  // 元数据
  createdAt: Date;
  createdBy: string;
  tags: string[];

  // 状态
  status: VersionStatus;
}

/**
 * 版本变更
 */
export interface VersionChange {
  entryId: string;
  changeType: ChangeType;
  oldValue?: string;
  newValue?: string;
  changeReason?: string;
}

/**
 * 变更类型
 */
export enum ChangeType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  MOVED = 'moved',
  TAGGED = 'tagged'
}

/**
 * 版本状态
 */
export enum VersionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ROLLED_BACK = 'rolled_back'
}

// ============ 场景推荐策略 ============

/**
 * 场景推荐配置
 */
export interface SceneRecommendation {
  scene: CreationScene;
  primaryCategories: KnowledgeCategory[];
  secondaryCategories?: KnowledgeCategory[];
  priority: RecommendationPriority;
  constraints: ConstraintType[];
}

/**
 * 推荐优先级
 */
export enum RecommendationPriority {
  PRIMARY = 'primary',     // 必须读取
  SECONDARY = 'secondary', // 建议读取
  OPTIONAL = 'optional'    // 可选读取
}

/**
 * 推荐结果
 */
export interface RecommendationResult {
  scene: CreationScene;
  categories: CategoryRecommendation[];
  suggestedEntries: KnowledgeEntry[];
  constraintTemplate: ConstraintItem[];
}

/**
 * 分类推荐
 */
export interface CategoryRecommendation {
  category: KnowledgeCategory;
  priority: RecommendationPriority;
  reason: string;
  expectedConstraints: ConstraintType[];
}
