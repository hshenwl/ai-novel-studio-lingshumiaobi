/**
 * 七步创作引擎 - 核心类型定义
 */

// ==================== 工作流状态枚举 ====================

/** 工作流状态 */
export enum WorkflowState {
  /** 待处理 */
  PENDING = 'PENDING',
  /** 规划中 */
  PLANNING = 'PLANNING',
  /** 已规划 */
  PLANNED = 'PLANNED',
  /** 写作中 */
  WRITING = 'WRITING',
  /** 已写完 */
  WRITTEN = 'WRITTEN',
  /** 深度阅读中 */
  DEEP_READING = 'DEEP_READING',
  /** 深度阅读完成 */
  DEEP_READ_DONE = 'DEEP_READ_DONE',
  /** 深度编辑中 */
  DEEP_EDITING = 'DEEP_EDITING',
  /** 深度编辑完成 */
  DEEP_EDIT_DONE = 'DEEP_EDIT_DONE',
  /** 审核中 */
  AUDITING = 'AUDITING',
  /** 审核完成 */
  AUDIT_DONE = 'AUDIT_DONE',
  /** 沉淀中 */
  SETTLING = 'SETTLING',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 修订中 */
  REVISING = 'REVISING',
  /** 已修订 */
  REVISED = 'REVISED',
  /** 重新审核中 */
  RE_AUDITING = 'RE_AUDITING',
  /** 已阻塞 */
  BLOCKED = 'BLOCKED',
  /** 失败 */
  FAILED = 'FAILED'
}

/** 审核结果 */
export enum AuditResult {
  /** 通过 */
  PASS = 'PASS',
  /** 小修订 */
  MINOR_REVISE = 'MINOR_REVISE',
  /** 大修订 */
  MAJOR_REVISE = 'MAJOR_REVISE',
  /** 重写 */
  REWRITE = 'REWRITE',
  /** 阻塞 */
  BLOCKED = 'BLOCKED'
}

// ==================== 约束清单 ====================

/** 创作约束项 */
export interface CreationConstraint {
  id: string;
  category: ConstraintCategory;
  name: string;
  description: string;
  value: string | number | boolean | string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: 'knowledge_base' | 'project_setting' | 'context' | 'user_input';
}

/** 约束类别 */
export enum ConstraintCategory {
  /** 世界观 */
  WORLD_BUILDING = 'world_building',
  /** 角色设定 */
  CHARACTER = 'character',
  /** 剧情主线 */
  PLOT = 'plot',
  /** 风格要求 */
  STYLE = 'style',
  /** 章节目标 */
  CHAPTER_GOAL = 'chapter_goal',
  /** 伏笔追踪 */
  FORESHADOWING = 'foreshadowing',
  /** 节奏控制 */
  PACING = 'pacing',
  /** 情感曲线 */
  EMOTION = 'emotion',
  /** 信息密度 */
  INFORMATION = 'information',
  /** POV视角 */
  POV = 'pov',
  /** 时长限制 */
  DURATION = 'duration',
  /** 字数要求 */
  WORD_COUNT = 'word_count',
  /** Hook设置 */
  HOOK = 'hook',
  /** 爽点设计 */
  COOL_MOMENT = 'cool_moment'
}

/** 创作约束清单（15项核心约束） */
export interface ConstraintChecklist {
  /** 约束ID */
  id: string;
  /** 章节ID */
  chapterId: string;
  /** 创建时间 */
  createdAt: Date;
  /** 约束列表 */
  constraints: CreationConstraint[];
  /** 验证状态 */
  validationStatus: Record<string, boolean>;
}

// ==================== Agent相关类型 ====================

/** Agent基础接口 */
export interface IAgent {
  /** Agent名称 */
  readonly name: string;
  /** Agent类型 */
  readonly type: AgentType;
  /** 执行Agent任务 */
  execute(context: AgentContext): Promise<AgentResult>;
}

/** Agent类型 */
export enum AgentType {
  PLANNER = 'PLANNER',
  WRITER = 'WRITER',
  DEEP_READER = 'DEEP_READER',
  DEEP_EDITOR = 'DEEP_EDITOR',
  AUDITOR = 'AUDITOR',
  REVISER = 'REVISER',
  SETTLER = 'SETTLER'
}

/** Agent上下文 */
export interface AgentContext {
  /** 项目ID */
  projectId: string;
  /** 章节ID */
  chapterId: string;
  /** 当前状态 */
  currentState: WorkflowState;
  /** 约束清单 */
  constraints?: ConstraintChecklist;
  /** 章节大纲 */
  chapterOutline?: ChapterOutline;
  /** 风格配置 */
  styleProfile?: StyleProfile;
  /** 已生成内容 */
  content?: string;
  /** 审核结果 */
  auditResult?: AuditFeedback;
  /** 额外上下文 */
  additionalContext?: Record<string, unknown>;
}

/** Agent执行结果 */
export interface AgentResult {
  /** 是否成功 */
  success: boolean;
  /** 下一个状态 */
  nextState?: WorkflowState;
  /** 输出数据 */
  data?: unknown;
  /** 错误信息 */
  error?: string;
  /** 警告信息 */
  warnings?: string[];
  /** 执行耗时(ms) */
  duration: number;
}

// ==================== 章节相关类型 ====================

/** 章节大纲 */
export interface ChapterOutline {
  /** 章节ID */
  id: string;
  /** 章节标题 */
  title: string;
  /** 章节序号 */
  order: number;
  /** 情节概要 */
  summary: string;
  /** 主要角色 */
  mainCharacters: string[];
  /** 场景列表 */
  scenes: SceneOutline[];
  /** 关键事件 */
  keyEvents: string[];
  /** 情感基调 */
  emotionalTone: string;
  /** Hook设计 */
  hook: string;
  /** 章节结尾类型 */
  endingType: 'cliffhanger' | 'resolution' | 'transition';
}

/** 场景大纲 */
export interface SceneOutline {
  /** 场景ID */
  id: string;
  /** 场景描述 */
  description: string;
  /** POV角色 */
  povCharacter?: string;
  /** 场景目标 */
  goal: string;
  /** 冲突 */
  conflict?: string;
  /** 结果 */
  outcome?: string;
}

// ==================== 风格配置 ====================

/** 风格配置 */
export interface StyleProfile {
  /** 风格ID */
  id: string;
  /** 风格名称 */
  name: string;
  /** 叙事视角 */
  narrativeVoice: 'first' | 'third_limited' | 'third_omniscient';
  /** 时态 */
  tense: 'past' | 'present';
  /** 语言风格 */
  languageStyle: 'formal' | 'casual' | 'literary' | 'colloquial';
  /** 节奏偏好 */
  pacingPreference: 'fast' | 'medium' | 'slow' | 'varied';
  /** 对话比例 */
  dialogueRatio: number; // 0-1
  /** 描写密度 */
  descriptionDensity: 'sparse' | 'moderate' | 'rich';
  /** 情感强度 */
  emotionalIntensity: 'subtle' | 'moderate' | 'intense';
  /** 禁用词汇/短语 */
  forbiddenPhrases: string[];
  /** 偏好词汇/短语 */
  preferredPhrases: string[];
}

// ==================== 审核相关 ====================

/** 审核反馈 */
export interface AuditFeedback {
  /** 审核ID */
  id: string;
  /** 审核结果 */
  result: AuditResult;
  /** 维度评分 */
  dimensionScores: DimensionScore[];
  /** 总分 */
  totalScore: number;
  /** 问题列表 */
  issues: AuditIssue[];
  /** 修订建议 */
  revisionSuggestions: RevisionSuggestion[];
  /** 审核时间 */
  auditedAt: Date;
}

/** 维度评分 */
export interface DimensionScore {
  /** 维度名称 */
  dimension: string;
  /** 分数 (0-100) */
  score: number;
  /** 权重 */
  weight: number;
  /** 说明 */
  comment?: string;
}

/** 审核问题 */
export interface AuditIssue {
  /** 问题ID */
  id: string;
  /** 问题类型 */
  type: 'critical' | 'major' | 'minor';
  /** 维度 */
  dimension: string;
  /** 描述 */
  description: string;
  /** 位置 */
  location?: {
    startLine?: number;
    endLine?: number;
    excerpt?: string;
  };
  /** 修复建议 */
  suggestion?: string;
}

/** 修订建议 */
export interface RevisionSuggestion {
  /** 建议ID */
  id: string;
  /** 建议类型 */
  type: 'add' | 'remove' | 'modify' | 'restructure';
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 描述 */
  description: string;
  /** 具体操作 */
  action?: string;
}

// ==================== 工作流实例 ====================

/** 工作流实例 */
export interface WorkflowInstance {
  /** 实例ID */
  id: string;
  /** 项目ID */
  projectId: string;
  /** 章节ID */
  chapterId: string;
  /** 当前状态 */
  currentState: WorkflowState;
  /** 历史状态 */
  stateHistory: StateTransition[];
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 检查点数据 */
  checkpoints: Checkpoint[];
  /** 错误记录 */
  errors: WorkflowError[];
  /** 重试次数 */
  retryCount: number;
  /** 元数据 */
  metadata: Record<string, unknown>;
}

/** 状态转换记录 */
export interface StateTransition {
  /** 源状态 */
  from: WorkflowState;
  /** 目标状态 */
  to: WorkflowState;
  /** 转换时间 */
  timestamp: Date;
  /** 触发Agent */
  agent: AgentType;
  /** 持续时间(ms) */
  duration: number;
  /** 备注 */
  note?: string;
}

/** 检查点 */
export interface Checkpoint {
  /** 检查点ID */
  id: string;
  /** 状态 */
  state: WorkflowState;
  /** 创建时间 */
  createdAt: Date;
  /** 数据快照 */
  snapshot: Record<string, unknown>;
}

/** 工作流错误 */
export interface WorkflowError {
  /** 错误ID */
  id: string;
  /** 发生状态 */
  state: WorkflowState;
  /** 错误类型 */
  type: 'agent_failure' | 'validation_error' | 'timeout' | 'system_error';
  /** 错误信息 */
  message: string;
  /** 堆栈 */
  stack?: string;
  /** 发生时间 */
  timestamp: Date;
  /** 是否已处理 */
  handled: boolean;
}

// ==================== 进度追踪 ====================

/** 工作流进度 */
export interface WorkflowProgress {
  /** 实例ID */
  instanceId: string;
  /** 当前状态 */
  currentState: WorkflowState;
  /** 进度百分比 */
  percentage: number;
  /** 已完成步骤 */
  completedSteps: AgentType[];
  /** 当前步骤 */
  currentStep?: AgentType;
  /** 待执行步骤 */
  pendingSteps: AgentType[];
  /** 预计剩余时间(ms) */
  estimatedRemaining?: number;
  /** 开始时间 */
  startedAt: Date;
  /** 消息 */
  message?: string;
}

// ==================== AI去味模式 ====================

/** AI去味模式 */
export enum AIDehumanizeMode {
  // 句式相关
  REMOVE_EM_DASH_OVERUSE = 'remove_em_dash_overuse',
  SIMPLIFY_COMPLEX_SENTENCES = 'simplify_complex_sentences',
  VARY_SENTENCE_STRUCTURE = 'vary_sentence_structure',
  REDUCE_PASSIVE_VOICE = 'reduce_passive_voice',
  
  // 词汇相关
  REMOVE_AI_VOCABULARY = 'remove_ai_vocabulary',
  REDUCE_ADVERB_OVERUSE = 'reduce_adverb_overuse',
  DIALOGUE_NATURALIZATION = 'dialogue_naturalization',
  
  // 结构相关
  BREAK_RULE_OF_THREE = 'break_rule_of_three',
  REDUCE_PARALLELISM = 'reduce_parallelism',
  REMOVE_INFLATED_SYMBOLISM = 'remove_inflated_symbolism',
  
  // 情感相关
  REDUCE_EMOTIONAL_CLICHES = 'reduce_emotional_cliches',
  GROUND_ABSTRACT_EMOTIONS = 'ground_abstract_emotions',
  
  // 节奏相关
  VARY_PARAGRAPH_LENGTH = 'vary_paragraph_length',
  REMOVE_FORMULAIC_TRANSITIONS = 'remove_formulaic_transitions',
  
  // 其他
  ADD_SPECIFIC_DETAILS = 'add_specific_details',
  REMOVE_VAGUE_ATTRIBUTIONS = 'remove_vague_attributions',
  REDUCE_PROMOTIONAL_TONE = 'reduce_promotional_tone',
  HUMANIZE_DIALOGUE_TAGS = 'humanize_dialogue_tags',
  REMOVE_OVER_EXPLANATION = 'remove_over_explanation',
  ADD_SUBTEXT = 'add_subtext',
  REDUNDANCY_REMOVAL = 'redundancy_removal',
  SHOW_DONT_TELL = 'show_dont_tell',
  IMPERFECT_CHARACTER_VOICE = 'imperfect_character_voice',
  CULTURAL_SPECIFICITY = 'cultural_specificity',
  REMOVE_HEDGING_LANGUAGE = 'remove_hedging_language',
  ADD_SENSORY_DETAILS = 'add_sensory_details',
  BREAK_PREDICTABLE_PATTERNS = 'break_predictable_patterns',
  CONTEXTUAL_DIALOGUE = 'contextual_dialogue',
  EMOTIONAL_AMBIGUITY = 'emotional_ambiguity',
  NARRATIVE_UNRELIABILITY = 'narrative_unreliability'
}

// ==================== 配置相关 ====================

/** 工作流配置 */
export interface WorkflowConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 超时时间(ms) */
  timeout: number;
  /** 是否启用断点续跑 */
  enableCheckpoint: boolean;
  /** 检查点保存间隔(ms) */
  checkpointInterval: number;
  /** 是否启用自动恢复 */
  enableAutoRecovery: boolean;
  /** 审核阈值 */
  auditThreshold: {
    pass: number;
    minorRevise: number;
    majorRevise: number;
    rewrite: number;
  };
  /** 最大修订轮次 */
  maxRevisionRounds: number;
  /** 启用的去味模式 */
  dehumanizeModes: AIDehumanizeMode[];
}
