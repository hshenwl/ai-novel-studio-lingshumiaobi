/**
 * Repository接口 - 数据库访问抽象层
 * 支持SQLite和PostgreSQL切换，为"本地优先、云端兼容"架构提供数据访问抽象
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 实体基类 - 所有数据库实体必须包含多租户字段
 */
export interface BaseEntity {
  id: string;
  tenant_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 查询条件构建器
 */
export interface QueryOptions<T> {
  where?: Partial<T>;
  whereIn?: { [K in keyof T]?: T[K][] };
  whereLike?: Partial<Record<keyof T, string>>;
  whereBetween?: { [K in keyof T]?: [T[K], T[K]] };
  orderBy?: { [K in keyof T]?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

/**
 * 事务接口
 */
export interface ITransaction {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * 数据库连接配置
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  pool_size?: number;
  ssl?: boolean;
  path?: string; // SQLite文件路径
}

// ============================================================================
// 核心Repository接口
// ============================================================================

/**
 * 通用Repository接口 - 定义标准CRUD操作
 */
export interface IRepository<T extends BaseEntity> {
  /**
   * 根据ID查找实体
   */
  findById(id: string): Promise<T | null>;

  /**
   * 根据条件查找单个实体
   */
  findOne(options: QueryOptions<T>): Promise<T | null>;

  /**
   * 根据条件查找多个实体
   */
  findMany(options: QueryOptions<T>): Promise<T[]>;

  /**
   * 分页查询
   */
  findPaginated(
    options: QueryOptions<T>,
    pagination: PaginationParams
  ): Promise<PaginatedResult<T>>;

  /**
   * 创建实体
   */
  create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;

  /**
   * 批量创建实体
   */
  createMany(entities: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T[]>;

  /**
   * 更新实体
   */
  update(id: string, updates: Partial<T>): Promise<T>;

  /**
   * 批量更新
   */
  updateMany(options: QueryOptions<T>, updates: Partial<T>): Promise<number>;

  /**
   * 删除实体（软删除）
   */
  delete(id: string): Promise<void>;

  /**
   * 批量删除
   */
  deleteMany(options: QueryOptions<T>): Promise<number>;

  /**
   * 永久删除（物理删除）
   */
  hardDelete(id: string): Promise<void>;

  /**
   * 统计数量
   */
  count(options?: QueryOptions<T>): Promise<number>;

  /**
   * 检查是否存在
   */
  exists(options: QueryOptions<T>): Promise<boolean>;

  /**
   * 开始事务
   */
  beginTransaction(): Promise<ITransaction>;

  /**
   * 在事务中执行操作
   */
  withTransaction<R>(transaction: ITransaction, fn: () => Promise<R>): Promise<R>;
}

// ============================================================================
// 业务实体接口
// ============================================================================

/**
 * 项目实体
 */
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  genre: string;
  target_word_count: number;
  current_word_count: number;
  status: 'draft' | 'writing' | 'revision' | 'completed' | 'published';
  settings: ProjectSettings;
  metadata: Record<string, any>;
}

export interface ProjectSettings {
  ai_model: string;
  writing_style: string;
  auto_save_interval: number;
  version_control_enabled: boolean;
}

/**
 * 章节实体
 */
export interface Chapter extends BaseEntity {
  project_id: string;
  volume_number: number;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  status: 'outline' | 'draft' | 'revision' | 'final';
  outline?: string;
  notes?: string;
  order_index: number;
}

/**
 * 角色实体
 */
export interface Character extends BaseEntity {
  project_id: string;
  name: string;
  aliases: string[];
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  gender?: string;
  age?: number;
  occupation?: string;
  personality: string[];
  background: string;
  relationships: CharacterRelationship[];
  appearance?: string;
  first_appearance_chapter?: string;
  metadata: Record<string, any>;
}

export interface CharacterRelationship {
  character_id: string;
  relationship_type: string;
  description?: string;
}

/**
 * 世界观设定实体
 */
export interface WorldBuilding extends BaseEntity {
  project_id: string;
  category: 'geography' | 'history' | 'culture' | 'magic_system' | 'technology' | 'politics' | 'economy' | 'other';
  name: string;
  description: string;
  tags: string[];
  references: string[];
  metadata: Record<string, any>;
}

/**
 * 大纲实体
 */
export interface Outline extends BaseEntity {
  project_id: string;
  title: string;
  content: string;
  type: 'main_plot' | 'sub_plot' | 'character_arc' | 'world_building';
  order_index: number;
  parent_id?: string;
  children?: Outline[];
}

/**
 * 知识库条目实体
 */
export interface KnowledgeEntry extends BaseEntity {
  project_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding?: number[];
  source: 'manual' | 'imported' | 'ai_generated';
  confidence_score?: number;
  references: string[];
}

/**
 * AI生成历史实体
 */
export interface AIGenerationHistory extends BaseEntity {
  project_id: string;
  chapter_id?: string;
  prompt: string;
  context: string;
  model: string;
  provider: string;
  response: string;
  tokens_used: number;
  generation_type: 'chapter' | 'outline' | 'character' | 'dialogue' | 'description';
  rating?: number;
  feedback?: string;
}

/**
 * 用户偏好设置实体
 */
export interface UserPreferences extends BaseEntity {
  theme: 'light' | 'dark' | 'system';
  language: string;
  font_size: number;
  font_family: string;
  line_height: number;
  auto_save: boolean;
  auto_save_interval: number;
  ai_provider: string;
  ai_model: string;
  keyboard_shortcuts: Record<string, string>;
  custom_settings: Record<string, any>;
}

// ============================================================================
// 特化Repository接口
// ============================================================================

/**
 * 项目Repository接口
 */
export interface IProjectRepository extends IRepository<Project> {
  /**
   * 查找用户的所有项目
   */
  findByUserId(userId: string, options?: QueryOptions<Project>): Promise<Project[]>;

  /**
   * 查找租户的所有项目
   */
  findByTenantId(tenantId: string, options?: QueryOptions<Project>): Promise<Project[]>;

  /**
   * 更新项目字数统计
   */
  updateWordCount(projectId: string, wordCount: number): Promise<void>;

  /**
   * 查找项目及其统计信息
   */
  findWithStats(projectId: string): Promise<Project & ProjectStats>;
}

export interface ProjectStats {
  total_chapters: number;
  total_characters: number;
  total_words: number;
  completed_chapters: number;
}

/**
 * 章节Repository接口
 */
export interface IChapterRepository extends IRepository<Chapter> {
  /**
   * 根据项目ID查找所有章节
   */
  findByProjectId(projectId: string, options?: QueryOptions<Chapter>): Promise<Chapter[]>;

  /**
   * 查找指定卷的章节
   */
  findByVolume(projectId: string, volumeNumber: number): Promise<Chapter[]>;

  /**
   * 获取下一章节
   */
  findNext(projectId: string, volumeNumber: number, chapterNumber: number): Promise<Chapter | null>;

  /**
   * 获取上一章节
   */
  findPrevious(projectId: string, volumeNumber: number, chapterNumber: number): Promise<Chapter | null>;

  /**
   * 批量更新章节顺序
   */
  updateOrder(projectId: string, chapters: Array<{ id: string; order_index: number }>): Promise<void>;

  /**
   * 计算项目总字数
   */
  calculateTotalWordCount(projectId: string): Promise<number>;
}

/**
 * 角色Repository接口
 */
export interface ICharacterRepository extends IRepository<Character> {
  /**
   * 根据项目ID查找所有角色
   */
  findByProjectId(projectId: string): Promise<Character[]>;

  /**
   * 根据角色查找角色
   */
  findByRole(projectId: string, role: Character['role']): Promise<Character[]>;

  /**
   * 搜索角色（支持模糊匹配）
   */
  search(projectId: string, query: string): Promise<Character[]>;

  /**
   * 查找角色关系
   */
  findRelationships(characterId: string): Promise<Array<Character & { relationship: CharacterRelationship }>>;

  /**
   * 添加角色关系
   */
  addRelationship(
    characterId: string,
    relatedCharacterId: string,
    relationshipType: string,
    description?: string
  ): Promise<void>;

  /**
   * 删除角色关系
   */
  removeRelationship(characterId: string, relatedCharacterId: string): Promise<void>;
}

/**
 * 世界观设定Repository接口
 */
export interface IWorldBuildingRepository extends IRepository<WorldBuilding> {
  /**
   * 根据项目ID查找所有设定
   */
  findByProjectId(projectId: string): Promise<WorldBuilding[]>;

  /**
   * 根据分类查找设定
   */
  findByCategory(projectId: string, category: WorldBuilding['category']): Promise<WorldBuilding[]>;

  /**
   * 根据标签查找设定
   */
  findByTags(projectId: string, tags: string[]): Promise<WorldBuilding[]>;

  /**
   * 搜索设定
   */
  search(projectId: string, query: string): Promise<WorldBuilding[]>;
}

/**
 * 大纲Repository接口
 */
export interface IOutlineRepository extends IRepository<Outline> {
  /**
   * 根据项目ID查找大纲树
   */
  findTreeByProjectId(projectId: string): Promise<Outline[]>;

  /**
   * 查找子大纲
   */
  findChildren(outlineId: string): Promise<Outline[]>;

  /**
   * 移动大纲节点
   */
  moveNode(outlineId: string, newParentId: string | null, newOrderIndex: number): Promise<void>;

  /**
   * 根据类型查找大纲
   */
  findByType(projectId: string, type: Outline['type']): Promise<Outline[]>;
}

/**
 * 知识库Repository接口
 */
export interface IKnowledgeRepository extends IRepository<KnowledgeEntry> {
  /**
   * 语义搜索（向量相似度）
   */
  semanticSearch(projectId: string, query: string, limit?: number): Promise<KnowledgeEntry[]>;

  /**
   * 根据分类查找
   */
  findByCategory(projectId: string, category: string): Promise<KnowledgeEntry[]>;

  /**
   * 批量更新嵌入向量
   */
  updateEmbeddings(entries: Array<{ id: string; embedding: number[] }>): Promise<void>;

  /**
   * 查找相似条目
   */
  findSimilar(entryId: string, limit?: number): Promise<Array<KnowledgeEntry & { similarity: number }>>;
}

/**
 * AI生成历史Repository接口
 */
export interface IAIGenerationHistoryRepository extends IRepository<AIGenerationHistory> {
  /**
   * 根据项目ID查找历史
   */
  findByProjectId(projectId: string, options?: QueryOptions<AIGenerationHistory>): Promise<AIGenerationHistory[]>;

  /**
   * 根据章节ID查找历史
   */
  findByChapterId(chapterId: string): Promise<AIGenerationHistory[]>;

  /**
   * 统计AI使用情况
   */
  getUsageStats(projectId: string, startDate?: Date, endDate?: Date): Promise<AIUsageStats>;

  /**
   * 查找高评分生成
   */
  findTopRated(projectId: string, limit?: number): Promise<AIGenerationHistory[]>;
}

export interface AIUsageStats {
  total_generations: number;
  total_tokens: number;
  by_model: Record<string, number>;
  by_type: Record<string, number>;
  avg_rating: number;
}

/**
 * 用户偏好Repository接口
 */
export interface IUserPreferencesRepository extends IRepository<UserPreferences> {
  /**
   * 根据用户ID查找偏好
   */
  findByUserId(userId: string): Promise<UserPreferences | null>;

  /**
   * 更新或创建偏好
   */
  upsert(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}

// ============================================================================
// Repository工厂接口
// ============================================================================

/**
 * Repository工厂 - 用于创建不同数据库类型的Repository实例
 */
export interface IRepositoryFactory {
  /**
   * 创建项目Repository
   */
  createProjectRepository(): IProjectRepository;

  /**
   * 创建章节Repository
   */
  createChapterRepository(): IChapterRepository;

  /**
   * 创建角色Repository
   */
  createCharacterRepository(): ICharacterRepository;

  /**
   * 创建世界观设定Repository
   */
  createWorldBuildingRepository(): IWorldBuildingRepository;

  /**
   * 创建大纲Repository
   */
  createOutlineRepository(): IOutlineRepository;

  /**
   * 创建知识库Repository
   */
  createKnowledgeRepository(): IKnowledgeRepository;

  /**
   * 创建AI生成历史Repository
   */
  createAIGenerationHistoryRepository(): IAIGenerationHistoryRepository;

  /**
   * 创建用户偏好Repository
   */
  createUserPreferencesRepository(): IUserPreferencesRepository;

  /**
   * 初始化数据库连接
   */
  initialize(config: DatabaseConfig): Promise<void>;

  /**
   * 关闭数据库连接
   */
  close(): Promise<void>;

  /**
   * 检查数据库连接状态
   */
  isConnected(): boolean;

  /**
   * 执行数据库迁移
   */
  migrate(): Promise<void>;

  /**
   * 执行数据库健康检查
   */
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}
