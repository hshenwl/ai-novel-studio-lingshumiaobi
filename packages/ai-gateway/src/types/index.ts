/**
 * AI Gateway - 核心类型定义
 */

// ========== 基础类型 ==========

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'qwen'      // 通义千问
  | 'zhipu'     // 智谱AI
  | 'deepseek'  // DeepSeek
  | 'wenxin'    // 文心一言
  | 'ollama'    // 本地Ollama
  | 'lmstudio'  // LM Studio
  | 'vllm'      // vLLM
  | 'custom';   // 自定义API

export type ModelRole = 'planner' | 'writer' | 'deepReader' | 'deepEditor' | 'auditor' | 'reviser' | 'settler';

export type FinishReason = 'stop' | 'length' | 'content_filter' | 'error';

// ========== 模型配置 ==========

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  metadata?: Record<string, any>;
}

export interface AgentModelConfig extends ModelConfig {
  role: ModelRole;
  fallbackModels?: ModelConfig[];
}

// ========== 消息类型 ==========

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface SystemMessage extends ChatMessage {
  role: 'system';
}

export interface UserMessage extends ChatMessage {
  role: 'user';
}

export interface AssistantMessage extends ChatMessage {
  role: 'assistant';
}

// ========== 请求/响应类型 ==========

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
  userId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface CompletionChoice {
  index: number;
  message: ChatMessage;
  finishReason: FinishReason;
}

export interface CompletionResponse {
  id: string;
  provider: AIProvider;
  model: string;
  choices: CompletionChoice[];
  usage: TokenUsage;
  created: number;
  latency?: number;
}

export interface StreamChunk {
  id: string;
  provider: AIProvider;
  model: string;
  delta: {
    role?: 'assistant';
    content?: string;
  };
  finishReason?: FinishReason;
}

// ========== Token使用统计 ==========

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  promptCost: number;      // 输入成本(美元)
  completionCost: number;  // 输出成本(美元)
  totalCost: number;       // 总成本(美元)
  currency: 'USD';
}

export interface ModelPricing {
  inputPricePer1K: number;   // 每千token输入价格
  outputPricePer1K: number;  // 每千token输出价格
}

// ========== 错误类型 ==========

export type AIGatewayErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MODEL_NOT_FOUND'
  | 'CONTEXT_LENGTH_EXCEEDED'
  | 'CONTENT_FILTERED'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'QUOTA_EXCEEDED';

export class AIGatewayError extends Error {
  constructor(
    public code: AIGatewayErrorCode,
    message: string,
    public provider?: AIProvider,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIGatewayError';
  }
}

// ========== 重试策略 ==========

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: AIGatewayErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'PROVIDER_ERROR',
    'NETWORK_ERROR',
    'TIMEOUT_ERROR'
  ]
};

// ========== 路由策略 ==========

export type RoutingStrategy = 'priority' | 'round-robin' | 'least-cost' | 'latency-based';

export interface RoutingRule {
  role: ModelRole;
  primaryModel: ModelConfig;
  fallbackModels?: ModelConfig[];
  strategy?: RoutingStrategy;
}

export interface RoutingConfig {
  rules: RoutingRule[];
  defaultStrategy: RoutingStrategy;
}

// ========== 日志配置 ==========

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableSensitiveDataLogging: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logTokenUsage: boolean;
}

export const DEFAULT_LOG_CONFIG: LogConfig = {
  level: 'info',
  enableSensitiveDataLogging: false,
  logRequests: true,
  logResponses: false,
  logTokenUsage: true
};