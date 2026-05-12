// API Types

// 通用响应类型
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

// 分页请求
export interface PageRequest {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 项目相关
export interface Project {
  id: string;
  name: string;
  description: string;
  cover?: string;
  genre: string;
  targetWords: number;
  currentWords: number;
  status: 'draft' | 'writing' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  genre: string;
  targetWords: number;
}

// 世界设定
export interface WorldBuilding {
  id: string;
  projectId: string;
  category: 'geography' | 'history' | 'culture' | 'magic' | 'technology' | 'politics' | 'economy' | 'other';
  name: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 小说总纲
export interface NovelOutline {
  id: string;
  projectId: string;
  title: string;
  logline: string;
  theme: string;
  genre: string;
  synopsis: string;
  mainPlot: string;
  subPlots: string[];
  targetWords: number;
  createdAt: string;
  updatedAt: string;
}

// 卷纲
export interface VolumeOutline {
  id: string;
  projectId: string;
  volumeNumber: number;
  title: string;
  synopsis: string;
  targetWords: number;
  chapters: ChapterOutline[];
  createdAt: string;
  updatedAt: string;
}

// 章纲
export interface ChapterOutline {
  id: string;
  projectId: string;
  volumeId: string;
  chapterNumber: number;
  title: string;
  synopsis: string;
  plotPoints: string[];
  characters: string[];
  targetWords: number;
  status: 'draft' | 'outlined' | 'writing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 章节
export interface Chapter {
  id: string;
  projectId: string;
  volumeId: string;
  chapterOutlineId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'writing' | 'revising' | 'completed';
  version: number;
  createdAt: string;
  updatedAt: string;
}

// 角色
export interface Character {
  id: string;
  projectId: string;
  name: string;
  aliases: string[];
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: number;
  gender?: string;
  appearance: string;
  personality: string;
  background: string;
  goals: string[];
  motivation: string;
  relationships: CharacterRelation[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRelation {
  characterId: string;
  characterName: string;
  relationship: string;
  description: string;
}

// 组织
export interface Organization {
  id: string;
  projectId: string;
  name: string;
  type: string;
  description: string;
  members: string[];
  goals: string[];
  structure: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 职业
export interface Profession {
  id: string;
  projectId: string;
  name: string;
  category: string;
  description: string;
  skills: string[];
  requirements: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 关系图谱
export interface RelationNode {
  id: string;
  name: string;
  type: 'character' | 'organization';
}

export interface RelationEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  description: string;
}

export interface RelationGraph {
  nodes: RelationNode[];
  edges: RelationEdge[];
}

// 伏笔
export interface Foreshadowing {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'plant' | 'payoff';
  chapterId?: string;
  relatedChapterId?: string;
  status: 'planted' | 'hinted' | 'paidoff';
  importance: 'major' | 'minor';
  createdAt: string;
  updatedAt: string;
}

// Hook
export interface Hook {
  id: string;
  projectId: string;
  chapterId: string;
  type: 'suspense' | 'conflict' | 'emotion' | 'curiosity' | 'cliffhanger';
  content: string;
  intensity: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// 写作风格
export interface WritingStyle {
  id: string;
  projectId: string;
  name: string;
  description: string;
  vocabulary: string[];
  sentencePatterns: string[];
  tone: string;
  perspective: 'first' | 'third-limited' | 'third-omniscient';
  examples: string[];
  createdAt: string;
  updatedAt: string;
}

// AI去味模式
export interface AIPolishConfig {
  id: string;
  projectId: string;
  name: string;
  rules: PolishRule[];
  intensity: 'light' | 'medium' | 'heavy';
  createdAt: string;
  updatedAt: string;
}

export interface PolishRule {
  id: string;
  category: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
}

// 知识库
export interface KnowledgeItem {
  id: string;
  projectId: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// 任务
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'generation' | 'polish' | 'analysis' | 'import' | 'export' | 'other';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// 日志
export interface Log {
  id: string;
  projectId?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  details?: string;
  createdAt: string;
}

// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'local' | 'other';
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 工作流
export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  steps: WorkflowStep[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}