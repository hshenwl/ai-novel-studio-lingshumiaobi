/**
 * AI Gateway 配置示例
 */

import { AIGateway, AIGatewayConfig, AIProvider, ModelConfig } from '../src';

// ========== 完整配置示例 ==========

export const fullConfig: AIGatewayConfig = {
  providers: new Map([
    // OpenAI
    ['openai', {
      provider: 'openai',
      model: 'gpt-4-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 60000,
      temperature: 0.7,
      maxTokens: 4096
    }],

    // Anthropic
    ['anthropic', {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      timeout: 60000
    }],

    // Google
    ['google', {
      provider: 'google',
      model: 'gemini-1.5-pro',
      apiKey: process.env.GOOGLE_API_KEY,
      maxRetries: 3
    }],

    // 通义千问
    ['qwen', {
      provider: 'qwen',
      model: 'qwen-max',
      apiKey: process.env.QWEN_API_KEY,
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    }],

    // 智谱AI
    ['zhipu', {
      provider: 'zhipu',
      model: 'glm-4',
      apiKey: process.env.ZHIPU_API_KEY,
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4'
    }],

    // DeepSeek
    ['deepseek', {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com/v1'
    }],

    // Ollama (本地)
    ['ollama', {
      provider: 'ollama',
      model: 'llama2',
      baseUrl: 'http://localhost:11434',
      timeout: 120000
    }]
  ]),

  routingStrategy: 'priority',

  logConfig: {
    level: 'info',
    enableSensitiveDataLogging: false,
    logRequests: true,
    logResponses: false,
    logTokenUsage: true
  },

  enableStatistics: true
};

// ========== 开发环境配置 ==========

export const devConfig: AIGatewayConfig = {
  providers: new Map([
    ['ollama', {
      provider: 'ollama',
      model: 'llama2',
      baseUrl: 'http://localhost:11434'
    }]
  ]),

  routingStrategy: 'priority',

  logConfig: {
    level: 'debug',
    enableSensitiveDataLogging: true,
    logRequests: true,
    logResponses: true,
    logTokenUsage: true
  }
};

// ========== 生产环境配置 ==========

export const prodConfig: AIGatewayConfig = {
  providers: new Map([
    ['openai', {
      provider: 'openai',
      model: 'gpt-4-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 5,
      timeout: 60000
    }],

    ['anthropic', {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 5,
      timeout: 60000
    }],

    ['qwen', {
      provider: 'qwen',
      model: 'qwen-max',
      apiKey: process.env.QWEN_API_KEY,
      maxRetries: 3
    }]
  ]),

  routingStrategy: 'latency-based',

  logConfig: {
    level: 'info',
    enableSensitiveDataLogging: false,
    logRequests: true,
    logResponses: false,
    logTokenUsage: true
  },

  enableStatistics: true
};

// ========== 角色专用配置 ==========

export const roleConfigs = {
  planner: {
    role: 'planner',
    provider: 'anthropic' as AIProvider,
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    fallbackModels: [
      { provider: 'openai' as AIProvider, model: 'gpt-4-turbo', temperature: 0.7 }
    ]
  },

  writer: {
    role: 'writer',
    provider: 'anthropic' as AIProvider,
    model: 'claude-3-sonnet-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.8,
    maxTokens: 8192,
    fallbackModels: [
      { provider: 'qwen' as AIProvider, model: 'qwen-max', temperature: 0.8 },
      { provider: 'openai' as AIProvider, model: 'gpt-4o', temperature: 0.8 }
    ]
  },

  deepReader: {
    role: 'deepReader',
    provider: 'openai' as AIProvider,
    model: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.5,
    maxTokens: 2048,
    fallbackModels: [
      { provider: 'anthropic' as AIProvider, model: 'claude-3-haiku-20240307' }
    ]
  },

  deepEditor: {
    role: 'deepEditor',
    provider: 'anthropic' as AIProvider,
    model: 'claude-3-sonnet-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.6,
    maxTokens: 4096,
    fallbackModels: [
      { provider: 'openai' as AIProvider, model: 'gpt-4-turbo' }
    ]
  },

  auditor: {
    role: 'auditor',
    provider: 'anthropic' as AIProvider,
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.3,
    maxTokens: 4096,
    fallbackModels: [
      { provider: 'openai' as AIProvider, model: 'gpt-4-turbo', temperature: 0.3 }
    ]
  },

  reviser: {
    role: 'reviser',
    provider: 'qwen' as AIProvider,
    model: 'qwen-max',
    apiKey: process.env.QWEN_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    fallbackModels: [
      { provider: 'anthropic' as AIProvider, model: 'claude-3-sonnet-20240229' }
    ]
  },

  settler: {
    role: 'settler',
    provider: 'zhipu' as AIProvider,
    model: 'glm-4',
    apiKey: process.env.ZHIPU_API_KEY,
    temperature: 0.4,
    maxTokens: 2048,
    fallbackModels: [
      { provider: 'openai' as AIProvider, model: 'gpt-3.5-turbo' }
    ]
  }
};

// ========== 创建Gateway实例 ==========

export function createGateway(env: 'dev' | 'prod' = 'prod'): AIGateway {
  const config = env === 'dev' ? devConfig : prodConfig;
  const gateway = new AIGateway(config);

  // 注册角色配置
  for (const [role, roleConfig] of Object.entries(roleConfigs)) {
    gateway.registerModelForRole(role as any, roleConfig as any);
  }

  return gateway;
}