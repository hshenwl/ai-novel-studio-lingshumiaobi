/**
 * 国产模型提供商基类 - 支持OpenAI兼容接口
 * 通义千问、智谱AI、DeepSeek、文心一言
 */

import axios, { AxiosInstance } from 'axios';
import { BaseProvider } from './base.provider';
import {
  AIProvider,
  ModelConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  TokenUsage,
  AIGatewayError,
  FinishReason
} from '../types';

export interface ChineseProviderConfig {
  provider: AIProvider;
  baseUrl: string;
  defaultModel: string;
  modelCapabilities: Record<string, any>;
}

export class ChineseProvider extends BaseProvider {
  private httpClient: AxiosInstance | null = null;
  private providerConfig: ChineseProviderConfig;

  constructor(config: ChineseProviderConfig) {
    super();
    this.providerConfig = config;
  }

  get provider(): AIProvider {
    return this.providerConfig.provider;
  }

  async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);
    
    if (!config.apiKey) {
      throw new AIGatewayError(
        'AUTHENTICATION_ERROR',
        `${this.provider} API key is required`,
        this.provider
      );
    }

    this.httpClient = axios.create({
      baseURL: config.baseUrl || this.providerConfig.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 60000
    });

    this.config = config;
    this.initialized = true;
  }

  async listModels(): Promise<string[]> {
    return Object.keys(this.providerConfig.modelCapabilities);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    return this.withRetry(async () => {
      if (!this.httpClient || !this.config) {
        throw new AIGatewayError(
          'INVALID_REQUEST',
          'Provider not initialized',
          this.provider
        );
      }

      const mergedRequest = this.mergeRequestParams(request, this.config);
      const startTime = Date.now();

      try {
        const response = await this.httpClient.post('/chat/completions', {
          model: mergedRequest.model!,
          messages: mergedRequest.messages,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop: mergedRequest.stop,
          stream: false
        });

        const data = response.data;
        const choice = data.choices[0];

        return {
          id: data.id || this.generateRequestId(),
          provider: this.provider,
          model: data.model || mergedRequest.model!,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: choice.message?.content || ''
            },
            finishReason: this.mapFinishReason(choice.finish_reason)
          }],
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          },
          created: data.created || Date.now() / 1000,
          latency: Date.now() - startTime
        };
      } catch (error) {
        throw this.toGatewayError(error);
      }
    });
  }

  async completeStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (usage: TokenUsage) => void
  ): Promise<void> {
    if (!this.httpClient || !this.config) {
      const error = new AIGatewayError(
        'INVALID_REQUEST',
        'Provider not initialized',
        this.provider
      );
      onError?.(error);
      throw error;
    }

    const mergedRequest = this.mergeRequestParams(request, this.config);
    const requestId = this.generateRequestId();

    try {
      const response = await this.httpClient.post('/chat/completions', {
        model: mergedRequest.model!,
        messages: mergedRequest.messages,
        temperature: mergedRequest.temperature,
        max_tokens: mergedRequest.maxTokens,
        top_p: mergedRequest.topP,
        stop: mergedRequest.stop,
        stream: true
      }, {
        responseType: 'stream'
      });

      const stream = response.data;
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const usage: TokenUsage = {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
              };
              onComplete?.(usage);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                onChunk({
                  id: requestId,
                  provider: this.provider,
                  model: mergedRequest.model!,
                  delta: {
                    role: 'assistant',
                    content: delta.content
                  }
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      stream.on('error', (error: Error) => {
        const gatewayError = this.toGatewayError(error);
        onError?.(gatewayError);
      });

      stream.on('end', () => {
        const usage: TokenUsage = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        };
        onComplete?.(usage);
      });

    } catch (error) {
      const gatewayError = this.toGatewayError(error);
      onError?.(gatewayError);
      throw gatewayError;
    }
  }

  async countTokens(text: string): Promise<number> {
    // 中文模型的平均token长度约为2个字符
    return Math.ceil(text.length / 2);
  }

  protected toGatewayError(error: any): AIGatewayError {
    if (error instanceof AIGatewayError) {
      return error;
    }

    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message || 'Unknown error';
    
    if (status === 401) {
      return new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'Invalid API key',
        this.provider,
        401,
        error
      );
    }

    if (status === 429) {
      return new AIGatewayError(
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded',
        this.provider,
        429,
        error
      );
    }

    if (status === 404) {
      return new AIGatewayError(
        'MODEL_NOT_FOUND',
        'Model not found',
        this.provider,
        404,
        error
      );
    }

    if (status === 400) {
      if (message.includes('context') || message.includes('length')) {
        return new AIGatewayError(
          'CONTEXT_LENGTH_EXCEEDED',
          'Context length exceeded',
          this.provider,
          400,
          error
        );
      }
      return new AIGatewayError(
        'INVALID_REQUEST',
        message,
        this.provider,
        400,
        error
      );
    }

    return new AIGatewayError(
      'PROVIDER_ERROR',
      message,
      this.provider,
      status,
      error
    );
  }

  private mapFinishReason(reason: string | undefined): FinishReason {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}

// ========== 各国产模型提供商配置 ==========

export const QWEN_CONFIG: ChineseProviderConfig = {
  provider: 'qwen',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  defaultModel: 'qwen-max',
  modelCapabilities: {
    'qwen-max': {
      contextWindow: 32768,
      maxOutputTokens: 8192,
      inputPricePer1K: 0.002,
      outputPricePer1K: 0.006
    },
    'qwen-plus': {
      contextWindow: 32768,
      maxOutputTokens: 8192,
      inputPricePer1K: 0.0004,
      outputPricePer1K: 0.0012
    },
    'qwen-turbo': {
      contextWindow: 8192,
      maxOutputTokens: 6144,
      inputPricePer1K: 0.0002,
      outputPricePer1K: 0.0006
    }
  }
};

export const ZHIPU_CONFIG: ChineseProviderConfig = {
  provider: 'zhipu',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  defaultModel: 'glm-4',
  modelCapabilities: {
    'glm-4': {
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.001,
      outputPricePer1K: 0.001
    },
    'glm-4-flash': {
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.0001,
      outputPricePer1K: 0.0001
    },
    'glm-3-turbo': {
      contextWindow: 4096,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.0001,
      outputPricePer1K: 0.0001
    }
  }
};

export const DEEPSEEK_CONFIG: ChineseProviderConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  defaultModel: 'deepseek-chat',
  modelCapabilities: {
    'deepseek-chat': {
      contextWindow: 64000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.00014,
      outputPricePer1K: 0.00028
    },
    'deepseek-coder': {
      contextWindow: 16384,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.00014,
      outputPricePer1K: 0.00028
    }
  }
};

export const WENXIN_CONFIG: ChineseProviderConfig = {
  provider: 'wenxin',
  baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
  defaultModel: 'ernie-bot-4',
  modelCapabilities: {
    'ernie-bot-4': {
      contextWindow: 8192,
      maxOutputTokens: 2048,
      inputPricePer1K: 0.0012,
      outputPricePer1K: 0.0012
    },
    'ernie-bot': {
      contextWindow: 4096,
      maxOutputTokens: 2048,
      inputPricePer1K: 0.0004,
      outputPricePer1K: 0.0008
    },
    'ernie-bot-turbo': {
      contextWindow: 4096,
      maxOutputTokens: 2048,
      inputPricePer1K: 0.00012,
      outputPricePer1K: 0.00012
    }
  }
};