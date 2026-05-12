/**
 * 模型路由策略
 */

import {
  AIProvider,
  ModelRole,
  ModelConfig,
  RoutingStrategy,
  RoutingRule,
  AgentModelConfig
} from '../types';

/**
 * 模型路由配置
 */
export interface ModelRouterConfig {
  rules: Map<ModelRole, AgentModelConfig>;
  defaultStrategy: RoutingStrategy;
}

/**
 * 推荐模型配置 - 基于任务角色
 */
export const RECOMMENDED_MODELS: Record<ModelRole, AgentModelConfig[]> = {
  planner: [
    {
      role: 'planner',
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 4096
    },
    {
      role: 'planner',
      provider: 'openai',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 4096
    }
  ],

  writer: [
    {
      role: 'writer',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.8,
      maxTokens: 8192
    },
    {
      role: 'writer',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.8,
      maxTokens: 8192
    },
    {
      role: 'writer',
      provider: 'qwen',
      model: 'qwen-max',
      temperature: 0.8,
      maxTokens: 8192
    }
  ],

  deepReader: [
    {
      role: 'deepReader',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 2048
    },
    {
      role: 'deepReader',
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      temperature: 0.5,
      maxTokens: 2048
    }
  ],

  deepEditor: [
    {
      role: 'deepEditor',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.6,
      maxTokens: 4096
    },
    {
      role: 'deepEditor',
      provider: 'openai',
      model: 'gpt-4-turbo',
      temperature: 0.6,
      maxTokens: 4096
    }
  ],

  auditor: [
    {
      role: 'auditor',
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      temperature: 0.3,
      maxTokens: 4096
    },
    {
      role: 'auditor',
      provider: 'openai',
      model: 'gpt-4-turbo',
      temperature: 0.3,
      maxTokens: 4096
    }
  ],

  reviser: [
    {
      role: 'reviser',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 4096
    },
    {
      role: 'reviser',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4096
    },
    {
      role: 'reviser',
      provider: 'qwen',
      model: 'qwen-max',
      temperature: 0.7,
      maxTokens: 4096
    }
  ],

  settler: [
    {
      role: 'settler',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.4,
      maxTokens: 2048
    },
    {
      role: 'settler',
      provider: 'zhipu',
      model: 'glm-4',
      temperature: 0.4,
      maxTokens: 2048
    }
  ]
};

/**
 * 模型路由器
 */
export class ModelRouter {
  private config: ModelRouterConfig;
  private roundRobinIndex: Map<ModelRole, number> = new Map();
  private modelLatency: Map<string, number[]> = new Map();

  constructor(customConfig?: Partial<ModelRouterConfig>) {
    // 初始化配置
    this.config = {
      rules: new Map(),
      defaultStrategy: customConfig?.defaultStrategy || 'priority'
    };

    // 加载推荐模型配置
    this.loadRecommendedModels();

    // 应用自定义配置
    if (customConfig?.rules) {
      for (const [role, modelConfig] of customConfig.rules) {
        this.config.rules.set(role, modelConfig);
      }
    }
  }

  /**
   * 选择模型
   */
  selectModel(
    role: ModelRole,
    strategy?: RoutingStrategy
  ): ModelConfig {
    const modelConfig = this.config.rules.get(role);
    if (!modelConfig) {
      throw new Error(`No model configured for role: ${role}`);
    }

    const selectedStrategy = strategy || this.config.defaultStrategy;
    
    switch (selectedStrategy) {
      case 'priority':
        return this.selectByPriority(role, modelConfig);
      
      case 'round-robin':
        return this.selectByRoundRobin(role, modelConfig);
      
      case 'least-cost':
        return this.selectByLeastCost(role, modelConfig);
      
      case 'latency-based':
        return this.selectByLatency(role, modelConfig);
      
      default:
        return modelConfig;
    }
  }

  /**
   * 注册模型
   */
  registerModel(role: ModelRole, config: AgentModelConfig): void {
    this.config.rules.set(role, config);
  }

  /**
   * 获取所有可用模型
   */
  getAvailableModels(role: ModelRole): ModelConfig[] {
    const config = this.config.rules.get(role);
    if (!config) {
      return [];
    }

    const models = [config];
    if (config.fallbackModels) {
      models.push(...config.fallbackModels);
    }
    return models;
  }

  /**
   * 记录模型延迟
   */
  recordLatency(model: string, latencyMs: number): void {
    if (!this.modelLatency.has(model)) {
      this.modelLatency.set(model, []);
    }
    
    const latencies = this.modelLatency.get(model)!;
    latencies.push(latencyMs);
    
    // 只保留最近10次延迟
    if (latencies.length > 10) {
      latencies.shift();
    }
  }

  private selectByPriority(role: ModelRole, config: AgentModelConfig): ModelConfig {
    // 返回主配置
    return {
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      metadata: config.metadata
    };
  }

  private selectByRoundRobin(role: ModelRole, config: AgentModelConfig): ModelConfig {
    const models = this.getAvailableModels(role);
    const currentIndex = this.roundRobinIndex.get(role) || 0;
    const selectedModel = models[currentIndex % models.length];
    
    this.roundRobinIndex.set(role, currentIndex + 1);
    return selectedModel;
  }

  private selectByLeastCost(role: ModelRole, config: AgentModelConfig): ModelConfig {
    // 简化的成本计算:优先选择价格最低的模型
    const models = this.getAvailableModels(role);
    
    // 按成本排序(这里简化为按模型名称判断)
    // 实际应该查询定价表
    const sortedModels = [...models].sort((a, b) => {
      const costA = this.estimateCost(a.model);
      const costB = this.estimateCost(b.model);
      return costA - costB;
    });

    return sortedModels[0];
  }

  private selectByLatency(role: ModelRole, config: AgentModelConfig): ModelConfig {
    const models = this.getAvailableModels(role);
    
    // 选择平均延迟最低的模型
    const sortedModels = [...models].sort((a, b) => {
      const latencyA = this.getAverageLatency(a.model);
      const latencyB = this.getAverageLatency(b.model);
      return latencyA - latencyB;
    });

    return sortedModels[0];
  }

  private getAverageLatency(model: string): number {
    const latencies = this.modelLatency.get(model);
    if (!latencies || latencies.length === 0) {
      return 0; // 没有历史数据,优先选择
    }
    return latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  }

  private estimateCost(model: string): number {
    // 简化的成本估算
    const cheapModels = ['gpt-3.5-turbo', 'claude-3-haiku', 'gemini-1.5-flash', 'glm-4', 'deepseek-chat'];
    const mediumModels = ['gpt-4o', 'claude-3-sonnet', 'gemini-1.5-pro', 'qwen-plus'];
    const expensiveModels = ['gpt-4-turbo', 'claude-3-opus', 'qwen-max'];

    if (cheapModels.includes(model)) return 1;
    if (mediumModels.includes(model)) return 2;
    if (expensiveModels.includes(model)) return 3;
    return 2; // 默认中等
  }

  private loadRecommendedModels(): void {
    for (const [role, configs] of Object.entries(RECOMMENDED_MODELS)) {
      if (configs.length > 0) {
        const primary = configs[0];
        const fallbacks = configs.slice(1);
        
        this.config.rules.set(role as ModelRole, {
          ...primary,
          fallbackModels: fallbacks.map(f => ({
            provider: f.provider,
            model: f.model,
            temperature: f.temperature,
            maxTokens: f.maxTokens
          }))
        });
      }
    }
  }
}