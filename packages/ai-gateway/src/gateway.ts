/**
 * AI Gateway - 统一入口
 * 提供对多个AI模型提供商的统一访问接口
 */

import {
  AIProvider,
  ModelRole,
  ModelConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  TokenUsage,
  RoutingStrategy,
  LogConfig
} from './types';
import { AIModelProvider } from './interfaces/provider.interface';
import { createProvider } from './providers';
import { TokenStatistics, CostCalculator } from './services/token-statistics';
import { ModelRouter, RECOMMENDED_MODELS } from './services/model-router';
import { Logger } from './services/logger';

/**
 * AI Gateway配置
 */
export interface AIGatewayConfig {
  providers: Map<AIProvider, ModelConfig>;
  routingStrategy?: RoutingStrategy;
  logConfig?: Partial<LogConfig>;
  enableStatistics?: boolean;
}

/**
 * AI Gateway主类
 */
export class AIGateway {
  private providers: Map<AIProvider, AIModelProvider> = new Map();
  private providerConfigs: Map<AIProvider, ModelConfig> = new Map();
  private router: ModelRouter;
  private statistics: TokenStatistics;
  private costCalculator: CostCalculator;
  private logger: Logger;

  constructor(config: AIGatewayConfig) {
    this.router = new ModelRouter({ 
      defaultStrategy: config.routingStrategy || 'priority' 
    });
    this.statistics = new TokenStatistics();
    this.costCalculator = new CostCalculator();
    this.logger = new Logger(config.logConfig || {});

    // 初始化提供商
    this.initializeProviders(config.providers);
  }

  /**
   * 完成请求(非流式)
   */
  async complete(
    request: CompletionRequest,
    role?: ModelRole
  ): Promise<CompletionResponse> {
    const { provider, modelConfig } = await this.resolveModel(request, role);
    
    this.logger.logRequest(
      provider,
      modelConfig.model,
      request.messages,
      { temperature: request.temperature, maxTokens: request.maxTokens }
    );

    const startTime = Date.now();
    
    try {
      const response = await provider.complete(request);
      
      // 记录统计
      if (request.metadata?.enableStatistics !== false) {
        this.statistics.recordUsage(
          response.provider,
          response.model,
          response.usage,
          request.userId,
          request.conversationId
        );

        this.logger.logTokenUsage(
          response.provider,
          response.model,
          response.usage
        );
      }

      // 记录延迟
      this.router.recordLatency(response.model, Date.now() - startTime);

      return response;
    } catch (error) {
      this.logger.logError(
        modelConfig.provider,
        error as Error,
        { model: modelConfig.model }
      );
      throw error;
    }
  }

  /**
   * 流式完成请求
   */
  async completeStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void,
    role?: ModelRole
  ): Promise<TokenUsage> {
    const { provider, modelConfig } = await this.resolveModel(request, role);
    
    this.logger.logRequest(
      provider,
      modelConfig.model,
      request.messages,
      { temperature: request.temperature, maxTokens: request.maxTokens, stream: true }
    );

    const startTime = Date.now();
    let finalUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };

    return new Promise((resolve, reject) => {
      provider.completeStream(
        request,
        onChunk,
        (error) => {
          this.logger.logError(
            modelConfig.provider,
            error,
            { model: modelConfig.model }
          );
          reject(error);
        },
        (usage) => {
          finalUsage = usage;
          
          // 记录统计
          if (request.metadata?.enableStatistics !== false) {
            this.statistics.recordUsage(
              modelConfig.provider,
              modelConfig.model,
              usage,
              request.userId,
              request.conversationId
            );

            this.logger.logTokenUsage(
              modelConfig.provider,
              modelConfig.model,
              usage
            );
          }

          // 记录延迟
          this.router.recordLatency(modelConfig.model, Date.now() - startTime);
          
          resolve(usage);
        }
      );
    });
  }

  /**
   * 按角色完成请求
   */
  async completeByRole(
    role: ModelRole,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    return this.complete(request, role);
  }

  /**
   * 注册提供商
   */
  async registerProvider(
    providerType: AIProvider,
    config: ModelConfig
  ): Promise<void> {
    const provider = createProvider(providerType, config);
    await provider.initialize(config);
    
    this.providers.set(providerType, provider);
    this.providerConfigs.set(providerType, config);
    
    this.logger.info(`Provider registered: ${providerType}`);
  }

  /**
   * 注册角色模型
   */
  registerModelForRole(
    role: ModelRole,
    config: ModelConfig & { fallbackModels?: ModelConfig[] }
  ): void {
    this.router.registerModel(role, {
      ...config,
      role
    });
    
    this.logger.info(`Model registered for role: ${role}`, {
      provider: config.provider,
      model: config.model
    });
  }

  /**
   * 获取Token使用统计
   */
  getTokenStatistics(): TokenStatistics {
    return this.statistics;
  }

  /**
   * 计算成本
   */
  calculateCost(usage: TokenUsage, model: string): { promptCost: number; completionCost: number; totalCost: number } {
    return this.costCalculator.calculate(usage, model);
  }

  /**
   * 获取推荐模型配置
   */
  getRecommendedModels(): Record<ModelRole, any[]> {
    return RECOMMENDED_MODELS;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<Record<AIProvider, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [type, provider] of this.providers) {
      try {
        results[type] = await provider.healthCheck();
      } catch {
        results[type] = false;
      }
    }
    
    return results as Record<AIProvider, boolean>;
  }

  /**
   * 关闭所有连接
   */
  async dispose(): Promise<void> {
    for (const [, provider] of this.providers) {
      await provider.dispose();
    }
    
    this.providers.clear();
    this.logger.info('AI Gateway disposed');
  }

  /**
   * 解析模型
   */
  private async resolveModel(
    request: CompletionRequest,
    role?: ModelRole
  ): Promise<{ provider: AIModelProvider; modelConfig: ModelConfig }> {
    let modelConfig: ModelConfig;

    if (role) {
      // 使用角色路由
      modelConfig = this.router.selectModel(role);
    } else if (request.model) {
      // 使用请求中指定的模型
      const providerType = this.inferProvider(request.model);
      const config = this.providerConfigs.get(providerType);
      
      if (!config) {
        throw new Error(`Provider not configured for model: ${request.model}`);
      }
      
      modelConfig = { ...config, model: request.model };
    } else {
      // 使用默认模型
      modelConfig = this.router.selectModel('writer');
    }

    // 获取或创建提供商实例
    let provider = this.providers.get(modelConfig.provider);
    
    if (!provider) {
      // 如果提供商未初始化,尝试使用配置初始化
      const config = this.providerConfigs.get(modelConfig.provider);
      if (!config) {
        throw new Error(`Provider not configured: ${modelConfig.provider}`);
      }
      
      provider = createProvider(modelConfig.provider, config);
      await provider.initialize(config);
      this.providers.set(modelConfig.provider, provider);
    }

    return { provider, modelConfig };
  }

  /**
   * 推断提供商
   */
  private inferProvider(model: string): AIProvider {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('qwen-')) return 'qwen';
    if (model.startsWith('glm-')) return 'zhipu';
    if (model.startsWith('deepseek-')) return 'deepseek';
    if (model.startsWith('ernie-')) return 'wenxin';
    if (model.includes('llama') || model.includes('mistral')) return 'ollama';
    
    return 'openai'; // 默认
  }

  /**
   * 初始化提供商
   */
  private async initializeProviders(
    configs: Map<AIProvider, ModelConfig>
  ): Promise<void> {
    for (const [type, config] of configs) {
      try {
        await this.registerProvider(type, config);
      } catch (error) {
        this.logger.error(`Failed to initialize provider: ${type}`, error);
      }
    }
  }
}

// 导出类型和工具函数
export * from './types';
export * from './interfaces/provider.interface';
export * from './providers';
export * from './services/token-statistics';
export * from './services/model-router';
export * from './services/logger';