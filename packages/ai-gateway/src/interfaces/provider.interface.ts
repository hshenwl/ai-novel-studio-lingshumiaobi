/**
 * AIModelProvider - 模型提供商接口
 * 所有AI模型适配器必须实现此接口
 */

import {
  AIProvider,
  ModelConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  TokenUsage
} from '../types';

/**
 * AI模型提供商接口
 */
export interface AIModelProvider {
  /**
   * 提供商标识
   */
  readonly provider: AIProvider;

  /**
   * 初始化提供商
   */
  initialize(config: ModelConfig): Promise<void>;

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean;

  /**
   * 获取可用模型列表
   */
  listModels(): Promise<string[]>;

  /**
   * 验证模型是否可用
   */
  validateModel(model: string): Promise<boolean>;

  /**
   * 发送完成请求(非流式)
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * 发送流式完成请求
   */
  completeStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (usage: TokenUsage) => void
  ): Promise<void>;

  /**
   * 计算Token数量
   */
  countTokens(text: string): Promise<number>;

  /**
   * 计算消息的Token数量
   */
  countMessageTokens(messages: CompletionRequest['messages']): Promise<TokenUsage>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>;

  /**
   * 关闭连接并清理资源
   */
  dispose(): Promise<void>;
}

/**
 * 流式响应处理器接口
 */
export interface StreamHandler {
  onChunk(chunk: StreamChunk): void;
  onError(error: Error): void;
  onComplete(usage: TokenUsage): void;
}

/**
 * 模型能力描述
 */
export interface ModelCapabilities {
  provider: AIProvider;
  model: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  supportsJSON: boolean;
  inputPricePer1K: number;
  outputPricePer1K: number;
}

/**
 * 模型选择器接口
 */
export interface ModelSelector {
  selectModel(role: string, requirements?: Partial<ModelCapabilities>): Promise<ModelConfig>;
  registerModel(role: string, config: ModelConfig): void;
  unregisterModel(role: string): void;
}

/**
 * Token计数器接口
 */
export interface TokenCounter {
  count(text: string, model: string): Promise<number>;
  countMessages(messages: CompletionRequest['messages'], model: string): Promise<TokenUsage>;
}

/**
 * 成本计算器接口
 */
export interface CostCalculator {
  calculate(usage: TokenUsage, model: string): number;
  getRate(model: string): { input: number; output: number };
}

/**
 * 速率限制器接口
 */
export interface RateLimiter {
  checkLimit(provider: AIProvider, model: string): Promise<boolean>;
  recordUsage(provider: AIProvider, model: string, tokens: number): void;
  getRemainingQuota(provider: AIProvider, model: string): Promise<number>;
}

/**
 * 日志记录器接口
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}