/**
 * AIModelProvider抽象基类
 * 提供通用的错误处理、重试机制和工具方法
 */

import {
  AIModelProvider,
  ModelCapabilities,
  StreamHandler
} from '../interfaces/provider.interface';
import {
  AIProvider,
  ModelConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  TokenUsage,
  AIGatewayError,
  RetryConfig,
  DEFAULT_RETRY_CONFIG
} from '../types';

export abstract class BaseProvider implements AIModelProvider {
  abstract readonly provider: AIProvider;
  
  protected config: ModelConfig | null = null;
  protected initialized = false;
  protected capabilities: Map<string, ModelCapabilities> = new Map();

  abstract initialize(config: ModelConfig): Promise<void>;
  abstract listModels(): Promise<string[]>;
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  abstract completeStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (usage: TokenUsage) => void
  ): Promise<void>;
  abstract countTokens(text: string): Promise<number>;

  isInitialized(): boolean {
    return this.initialized;
  }

  async validateModel(model: string): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(model);
  }

  async countMessageTokens(messages: CompletionRequest['messages']): Promise<TokenUsage> {
    let totalTokens = 0;
    
    for (const message of messages) {
      // 每条消息都有额外的格式开销(角色等)
      totalTokens += 4; // 消息格式开销
      totalTokens += await this.countTokens(message.content);
      if (message.name) {
        totalTokens += await this.countTokens(message.name);
      }
    }
    
    totalTokens += 2; // 消息列表开始和结束标记
    
    return {
      promptTokens: totalTokens,
      completionTokens: 0,
      totalTokens
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }
    
    try {
      // 尝试获取模型列表作为健康检查
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }

  async dispose(): Promise<void> {
    this.initialized = false;
    this.config = null;
    this.capabilities.clear();
  }

  /**
   * 使用重试机制执行操作
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // 检查是否为可重试错误
        const gatewayError = this.toGatewayError(error);
        if (!retryConfig.retryableErrors.includes(gatewayError.code)) {
          throw gatewayError;
        }

        // 最后一次尝试，直接抛出错误
        if (attempt === retryConfig.maxRetries) {
          throw gatewayError;
        }

        // 等待后重试
        await this.sleep(delay);
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
      }
    }

    throw lastError;
  }

  /**
   * 转换为Gateway错误
   */
  protected abstract toGatewayError(error: any): AIGatewayError;

  /**
   * 创建请求ID
   */
  protected generateRequestId(): string {
    return `${this.provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证配置
   */
  protected validateConfig(config: ModelConfig): void {
    if (!config.model) {
      throw new AIGatewayError(
        'INVALID_REQUEST',
        'Model name is required',
        this.provider
      );
    }
  }

  /**
   * 合并请求参数
   */
  protected mergeRequestParams(
    request: CompletionRequest,
    config: ModelConfig
  ): CompletionRequest {
    return {
      ...request,
      model: request.model || config.model,
      temperature: request.temperature ?? config.temperature,
      maxTokens: request.maxTokens ?? config.maxTokens,
      topP: request.topP ?? config.topP
    };
  }
}