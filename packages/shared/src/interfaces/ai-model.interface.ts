/**
 * AIModelProvider接口 - AI模型网关抽象层
 * 支持OpenAI、Claude、Gemini等多种AI模型切换
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * AI模型提供者类型
 */
export type AIModelProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure-openai'
  | 'cohere'
  | 'huggingface'
  | 'local'
  | 'custom';

/**
 * 模型类型
 */
export type ModelType =
  | 'chat'           // 对话模型
  | 'completion'     // 文本补全
  | 'embedding'      // 向量嵌入
  | 'image'          // 图像生成
  | 'audio'          // 音频处理
  | 'multimodal';    // 多模态

/**
 * AI模型配置
 */
export interface AIModelConfig {
  provider: AIModelProviderType;
  models: ModelConfig[];
  default_model?: string;
  timeout?: number;
  max_retries?: number;
  retry_delay?: number;

  // OpenAI配置
  openai?: {
    api_key: string;
    organization?: string;
    base_url?: string;
  };

  // Anthropic配置
  anthropic?: {
    api_key: string;
    base_url?: string;
  };

  // Google配置
  google?: {
    api_key: string;
    project_id?: string;
    location?: string;
  };

  // Azure OpenAI配置
  azure_openai?: {
    api_key: string;
    endpoint: string;
    deployment_name: string;
    api_version?: string;
  };

  // Cohere配置
  cohere?: {
    api_key: string;
    base_url?: string;
  };

  // Hugging Face配置
  huggingface?: {
    api_key: string;
    model_id?: string;
  };

  // 本地模型配置
  local?: {
    endpoint: string;
    model_path?: string;
    gpu?: boolean;
  };

  // 自定义配置
  custom?: {
    endpoint: string;
    api_key?: string;
    headers?: Record<string, string>;
  };

  // 负载均衡配置
  load_balancing?: {
    enabled: boolean;
    strategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
    weights?: Record<string, number>;
  };

  // 成本控制
  cost_control?: {
    max_tokens_per_day?: number;
    max_tokens_per_month?: number;
    max_cost_per_day?: number;
    max_cost_per_month?: number;
    alert_thresholds?: number[];
  };
}

/**
 * 模型配置
 */
export interface ModelConfig {
  id: string;
  name: string;
  type: ModelType;
  enabled: boolean;

  // 模型参数
  max_tokens: number;
  max_context_tokens: number;
  supports_streaming: boolean;
  supports_functions: boolean;
  supports_vision: boolean;

  // 定价信息
  pricing?: ModelPricing;

  // 限制
  rate_limits?: RateLimit;

  // 模型别名
  aliases?: string[];
}

/**
 * 模型定价
 */
export interface ModelPricing {
  input_cost_per_token: number;
  output_cost_per_token: number;
  embedding_cost_per_token?: number;
  image_cost_per_image?: number;
  currency: string;
}

/**
 * 速率限制
 */
export interface RateLimit {
  requests_per_minute?: number;
  tokens_per_minute?: number;
  requests_per_day?: number;
  tokens_per_day?: number;
  concurrent_requests?: number;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | ChatContent[];
  name?: string;
  function_call?: FunctionCall;
}

/**
 * 聊天内容（支持多模态）
 */
export interface ChatContent {
  type: 'text' | 'image_url' | 'image_base64';
  text?: string;
  image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
  image_base64?: { data: string; mime_type: string };
}

/**
 * 函数调用
 */
export interface FunctionCall {
  name: string;
  arguments: string;
}

/**
 * 函数定义
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * 生成选项
 */
export interface GenerationOptions {
  model?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  stop?: string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number;
  stream?: boolean;
  functions?: FunctionDefinition[];
  function_call?: 'none' | 'auto' | { name: string };
  response_format?: { type: 'text' | 'json_object' };
  user?: string;
  metadata?: Record<string, any>;
  timeout?: number;
  retry_on_error?: boolean;
}

/**
 * 生成结果
 */
export interface GenerationResult {
  id: string;
  model: string;
  provider: AIModelProviderType;
  content: string;
  role: 'assistant';
  function_call?: FunctionCall;
  usage: TokenUsage;
  finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'error';
  created_at: Date;
  latency_ms: number;
  cost?: number;
  safety?: SafetyResult;
}

/**
 * Token使用量
 */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cached_tokens?: number;
}

/**
 * 安全检查结果
 */
export interface SafetyResult {
  flagged: boolean;
  categories?: string[];
  severity?: 'low' | 'medium' | 'high';
}

/**
 * 流式生成事件
 */
export interface StreamEvent {
  type: 'content' | 'function_call' | 'usage' | 'error' | 'done';
  content?: string;
  delta?: string;
  function_call?: Partial<FunctionCall>;
  usage?: Partial<TokenUsage>;
  error?: AIError;
}

/**
 * AI错误
 */
export interface AIError {
  code: string;
  message: string;
  type?: string;
  details?: any;
  retryable: boolean;
}

/**
 * 嵌入选项
 */
export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  encoding_format?: 'float' | 'base64';
  user?: string;
}

/**
 * 嵌入结果
 */
export interface EmbeddingResult {
  id: string;
  model: string;
  provider: AIModelProviderType;
  embedding: number[];
  usage: TokenUsage;
  created_at: Date;
}

/**
 * 图像生成选项
 */
export interface ImageGenerationOptions {
  model?: string;
  prompt: string;
  negative_prompt?: string;
  size?: `${number}x${number}`;
  quality?: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  n?: number;
  response_format?: 'url' | 'b64_json';
  user?: string;
}

/**
 * 图像生成结果
 */
export interface ImageGenerationResult {
  id: string;
  model: string;
  provider: AIModelProviderType;
  images: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  created_at: Date;
  usage?: TokenUsage;
  cost?: number;
}

// ============================================================================
// 核心AIModelProvider接口
// ============================================================================

/**
 * AI模型提供者接口
 */
export interface IAIModelProvider {
  /**
   * 初始化提供者
   */
  initialize(config: AIModelConfig): Promise<void>;

  /**
   * 关闭提供者
   */
  close(): Promise<void>;

  /**
   * 获取提供者类型
   */
  getType(): AIModelProviderType;

  /**
   * 检查服务是否可用
   */
  isAvailable(): Promise<boolean>;

  // ============================================================================
  // 模型管理
  // ============================================================================

  /**
   * 获取可用模型列表
   */
  listModels(): Promise<ModelConfig[]>;

  /**
   * 获取模型信息
   */
  getModel(modelId: string): Promise<ModelConfig | null>;

  /**
   * 获取默认模型
   */
  getDefaultModel(type?: ModelType): Promise<string>;

  /**
   * 检查模型是否支持某功能
   */
  supportsFeature(modelId: string, feature: 'streaming' | 'functions' | 'vision'): Promise<boolean>;

  // ============================================================================
  // 聊天与文本生成
  // ============================================================================

  /**
   * 聊天生成
   */
  chat(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<GenerationResult>;

  /**
   * 流式聊天生成
   */
  chatStream(
    messages: ChatMessage[],
    options?: GenerationOptions
  ): Promise<AsyncIterable<StreamEvent>>;

  /**
   * 文本补全
   */
  complete(
    prompt: string,
    options?: GenerationOptions
  ): Promise<GenerationResult>;

  /**
   * 流式文本补全
   */
  completeStream(
    prompt: string,
    options?: GenerationOptions
  ): Promise<AsyncIterable<StreamEvent>>;

  // ============================================================================
  // 向量嵌入
  // ============================================================================

  /**
   * 生成文本嵌入向量
   */
  createEmbedding(
    text: string | string[],
    options?: EmbeddingOptions
  ): Promise<EmbeddingResult | EmbeddingResult[]>;

  /**
   * 批量生成嵌入向量
   */
  createEmbeddings(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<EmbeddingResult[]>;

  // ============================================================================
  // 图像生成
  // ============================================================================

  /**
   * 生成图像
   */
  generateImage(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult>;

  // ============================================================================
  // 使用统计与成本
  // ============================================================================

  /**
   * 获取使用统计
   */
  getUsageStats(options?: {
    start_date?: Date;
    end_date?: Date;
    model?: string;
  }): Promise<AIUsageStats>;

  /**
   * 计算成本
   */
  calculateCost(usage: TokenUsage, model: string): Promise<number>;

  /**
   * 检查预算限制
   */
  checkBudgetLimit(): Promise<{ exceeded: boolean; usage: AIUsageStats }>;

  // ============================================================================
  // 健康检查
  // ============================================================================

  /**
   * 健康检查
   */
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string; latency?: number }>;

  /**
   * 测试模型连接
   */
  testConnection(modelId: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * AI使用统计
 */
export interface AIUsageStats {
  total_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
  by_model: Record<string, ModelUsageStats>;
  by_day: Record<string, DailyUsageStats>;
}

export interface ModelUsageStats {
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  avg_latency_ms: number;
  error_rate: number;
}

export interface DailyUsageStats {
  requests: number;
  tokens: number;
  cost: number;
}

// ============================================================================
// 特化AI模型接口
// ============================================================================

/**
 * 小说明成生器接口
 */
export interface INovelGenerator {
  /**
   * 生成章节
   */
  generateChapter(
    projectId: string,
    chapterId: string,
    options?: NovelGenerationOptions
  ): Promise<NovelGenerationResult>;

  /**
   * 生成大纲
   */
  generateOutline(
    projectId: string,
    premise: string,
    options?: OutlineGenerationOptions
  ): Promise<OutlineGenerationResult>;

  /**
   * 生成角色
   */
  generateCharacter(
    projectId: string,
    description: string,
    options?: CharacterGenerationOptions
  ): Promise<CharacterGenerationResult>;

  /**
   * 生成对话
   */
  generateDialogue(
    projectId: string,
    characters: string[],
    context: string,
    options?: DialogueGenerationOptions
  ): Promise<DialogueGenerationResult>;

  /**
   * 续写文本
   */
  continueText(
    text: string,
    options?: ContinueTextOptions
  ): Promise<ContinueTextResult>;

  /**
   * 改写文本
   */
  rewriteText(
    text: string,
    style?: string,
    options?: RewriteTextOptions
  ): Promise<RewriteTextResult>;

  /**
   * 润色文本
   */
  polishText(
    text: string,
    options?: PolishTextOptions
  ): Promise<PolishTextResult>;

  /**
   * 生成描写
   */
  generateDescription(
    type: 'scene' | 'character' | 'action' | 'emotion',
    context: string,
    options?: DescriptionGenerationOptions
  ): Promise<DescriptionGenerationResult>;
}

/**
 * 小说明生成选项
 */
export interface NovelGenerationOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  style?: string;
  tone?: string;
  perspective?: 'first' | 'third';
  include_outline?: boolean;
  reference_chapters?: string[];
  context_window?: number;
}

export interface NovelGenerationResult {
  content: string;
  word_count: number;
  usage: TokenUsage;
  suggestions?: string[];
  alternatives?: string[];
}

/**
 * 大纲生成选项
 */
export interface OutlineGenerationOptions {
  model?: string;
  target_word_count?: number;
  chapter_count?: number;
  genre?: string;
  themes?: string[];
  structure?: 'three_act' | 'five_act' | 'hero_journey' | 'custom';
}

export interface OutlineGenerationResult {
  outline: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
  }>;
  themes: string[];
  usage: TokenUsage;
}

/**
 * 角色生成选项
 */
export interface CharacterGenerationOptions {
  model?: string;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  genre?: string;
  traits?: string[];
}

export interface CharacterGenerationResult {
  name: string;
  role: string;
  personality: string[];
  background: string;
  appearance: string;
  motivation: string;
  conflicts: string[];
  usage: TokenUsage;
}

/**
 * 对话生成选项
 */
export interface DialogueGenerationOptions {
  model?: string;
  tone?: string;
  style?: string;
  max_turns?: number;
}

export interface DialogueGenerationResult {
  dialogue: Array<{
    character: string;
    line: string;
    action?: string;
  }>;
  usage: TokenUsage;
}

/**
 * 续写选项
 */
export interface ContinueTextOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  style?: string;
}

export interface ContinueTextResult {
  continuation: string;
  usage: TokenUsage;
}

/**
 * 改写选项
 */
export interface RewriteTextOptions {
  model?: string;
  style?: string;
  preserve_meaning?: boolean;
  tone?: string;
}

export interface RewriteTextResult {
  rewritten_text: string;
  changes_summary: string;
  usage: TokenUsage;
}

/**
 * 润色选项
 */
export interface PolishTextOptions {
  model?: string;
  aspects?: ('grammar' | 'style' | 'flow' | 'vocabulary')[];
}

export interface PolishTextResult {
  polished_text: string;
  improvements: string[];
  usage: TokenUsage;
}

/**
 * 描写生成选项
 */
export interface DescriptionGenerationOptions {
  model?: string;
  sensory_details?: boolean;
  length?: 'short' | 'medium' | 'long';
}

export interface DescriptionGenerationResult {
  description: string;
  word_count: number;
  usage: TokenUsage;
}

/**
 * 知识库问答接口
 */
export interface IKnowledgeQA {
  /**
   * 基于知识库回答问题
   */
  answer(
    projectId: string,
    question: string,
    options?: KnowledgeQAOptions
  ): Promise<KnowledgeQAResult>;

  /**
   * 检索相关上下文
   */
  retrieveContext(
    projectId: string,
    query: string,
    options?: ContextRetrievalOptions
  ): Promise<ContextRetrievalResult>;

  /**
   * 总结文本
   */
  summarize(
    text: string,
    options?: SummarizeOptions
  ): Promise<SummarizeResult>;
}

export interface KnowledgeQAOptions {
  model?: string;
  max_context_length?: number;
  include_sources?: boolean;
  temperature?: number;
}

export interface KnowledgeQAResult {
  answer: string;
  sources: Array<{
    entry_id: string;
    title: string;
    relevance: number;
  }>;
  confidence: number;
  usage: TokenUsage;
}

export interface ContextRetrievalOptions {
  top_k?: number;
  min_relevance?: number;
  include_metadata?: boolean;
}

export interface ContextRetrievalResult {
  contexts: Array<{
    content: string;
    source: string;
    relevance: number;
  }>;
  total_tokens: number;
}

export interface SummarizeOptions {
  model?: string;
  max_length?: number;
  style?: 'bullet_points' | 'paragraph' | 'key_points';
}

export interface SummarizeResult {
  summary: string;
  key_points?: string[];
  usage: TokenUsage;
}

// ============================================================================
// AI模型路由接口
// ============================================================================

/**
 * 模型路由策略
 */
export type ModelRoutingStrategy =
  | 'default'           // 使用默认模型
  | 'round_robin'       // 轮询
  | 'least_latency'     // 最低延迟
  | 'lowest_cost'       // 最低成本
  | 'highest_quality'   // 最高质量
  | 'weighted'          // 加权选择
  | 'custom';           // 自定义

/**
 * 模型路由接口
 */
export interface IModelRouter {
  /**
   * 选择最佳模型
   */
  selectModel(
    type: ModelType,
    options?: {
      strategy?: ModelRoutingStrategy;
      constraints?: ModelConstraints;
      preferences?: Record<string, any>;
    }
  ): Promise<string>;

  /**
   * 设置路由策略
   */
  setRoutingStrategy(strategy: ModelRoutingStrategy): void;

  /**
   * 添加模型权重
   */
  setModelWeight(modelId: string, weight: number): void;

  /**
   * 获取模型性能指标
   */
  getModelMetrics(modelId: string): Promise<ModelMetrics>;
}

export interface ModelConstraints {
  max_latency_ms?: number;
  max_cost_per_token?: number;
  min_context_tokens?: number;
  required_features?: Array<'streaming' | 'functions' | 'vision'>;
}

export interface ModelMetrics {
  model_id: string;
  avg_latency_ms: number;
  success_rate: number;
  error_rate: number;
  avg_cost_per_request: number;
  last_updated: Date;
}

// ============================================================================
// AI模型缓存接口
// ============================================================================

/**
 * 模型缓存接口
 */
export interface IModelCache {
  /**
   * 获取缓存的响应
   */
  get(prompt: string, model: string, options?: GenerationOptions): Promise<GenerationResult | null>;

  /**
   * 缓存响应
   */
  set(prompt: string, model: string, result: GenerationResult, ttl?: number): Promise<void>;

  /**
   * 清除缓存
   */
  clear(pattern?: string): Promise<void>;

  /**
   * 获取缓存统计
   */
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  total_entries: number;
  total_size_bytes: number;
  hit_rate: number;
  miss_rate: number;
  by_model: Record<string, number>;
}

// ============================================================================
// AI模型提供者工厂接口
// ============================================================================

/**
 * AI模型提供者工厂
 */
export interface IAIModelProviderFactory {
  /**
   * 创建模型提供者
   */
  createProvider(config: AIModelConfig): IAIModelProvider;

  /**
   * 创建小说生成器
   */
  createNovelGenerator(config: AIModelConfig): INovelGenerator;

  /**
   * 创建知识库问答
   */
  createKnowledgeQA(config: AIModelConfig): IKnowledgeQA;

  /**
   * 创建模型路由器
   */
  createRouter(providers: IAIModelProvider[]): IModelRouter;

  /**
   * 创建模型缓存
   */
  createCache(): IModelCache;

  /**
   * 获取默认配置
   */
  getDefaultConfig(type: AIModelProviderType): AIModelConfig;

  /**
   * 验证配置
   */
  validateConfig(config: AIModelConfig): Promise<{ valid: boolean; errors?: string[] }>;
}

// ============================================================================
// AI模型事件接口
// ============================================================================

/**
 * AI模型事件类型
 */
export type AIModelEventType =
  | 'request_started'
  | 'request_completed'
  | 'request_failed'
  | 'token_generated'
  | 'rate_limit_hit'
  | 'budget_exceeded';

/**
 * AI模型事件
 */
export interface AIModelEvent {
  type: AIModelEventType;
  model: string;
  provider: AIModelProviderType;
  timestamp: Date;
  data?: any;
}

/**
 * AI模型事件监听器
 */
export type AIModelEventListener = (event: AIModelEvent) => void | Promise<void>;

/**
 * 支持事件的AI模型提供者接口
 */
export interface IEventedAIModelProvider extends IAIModelProvider {
  /**
   * 添加事件监听器
   */
  addEventListener(type: AIModelEventType, listener: AIModelEventListener): void;

  /**
   * 移除事件监听器
   */
  removeEventListener(type: AIModelEventType, listener: AIModelEventListener): void;

  /**
   * 移除所有监听器
   */
  removeAllEventListeners(type?: AIModelEventType): void;
}
