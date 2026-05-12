/**
 * 本地模型提供商 - 支持Ollama、LM Studio、vLLM
 * 这些模型通常提供OpenAI兼容的API接口
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

export interface LocalProviderConfig {
  provider: AIProvider;
  defaultBaseUrl: string;
  defaultModel?: string;
}

export class LocalProvider extends BaseProvider {
  private httpClient: AxiosInstance | null = null;
  private localConfig: LocalProviderConfig;
  private availableModels: string[] = [];

  constructor(config: LocalProviderConfig) {
    super();
    this.localConfig = config;
  }

  get provider(): AIProvider {
    return this.localConfig.provider;
  }

  async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);

    const baseUrl = config.baseUrl || this.localConfig.defaultBaseUrl;
    
    this.httpClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 120000 // 本地模型可能需要更长时间
    });

    this.config = config;
    this.initialized = true;

    // 尝试获取可用模型列表
    try {
      await this.fetchAvailableModels();
    } catch (error) {
      // 如果无法获取模型列表,使用默认模型
      console.warn('Failed to fetch model list:', error);
    }
  }

  async listModels(): Promise<string[]> {
    if (this.availableModels.length > 0) {
      return this.availableModels;
    }
    
    await this.fetchAvailableModels();
    return this.availableModels;
  }

  private async fetchAvailableModels(): Promise<void> {
    if (!this.httpClient) return;

    try {
      let endpoint = '/v1/models';
      
      // Ollama使用不同的端点
      if (this.localConfig.provider === 'ollama') {
        endpoint = '/api/tags';
        const response = await this.httpClient.get(endpoint);
        this.availableModels = response.data.models?.map((m: any) => m.name) || [];
      } else {
        const response = await this.httpClient.get(endpoint);
        this.availableModels = response.data.data?.map((m: any) => m.id) || [];
      }
    } catch (error) {
      // 如果获取失败,使用默认模型
      if (this.localConfig.defaultModel) {
        this.availableModels = [this.localConfig.defaultModel];
      }
    }
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
        let endpoint = '/v1/chat/completions';
        let requestBody: any;

        if (this.localConfig.provider === 'ollama') {
          // Ollama使用不同的API格式
          endpoint = '/api/chat';
          requestBody = {
            model: mergedRequest.model!,
            messages: mergedRequest.messages,
            stream: false,
            options: {
              temperature: mergedRequest.temperature,
              num_predict: mergedRequest.maxTokens,
              top_p: mergedRequest.topP,
              stop: mergedRequest.stop
            }
          };
        } else {
          // OpenAI兼容格式
          requestBody = {
            model: mergedRequest.model!,
            messages: mergedRequest.messages,
            temperature: mergedRequest.temperature,
            max_tokens: mergedRequest.maxTokens,
            top_p: mergedRequest.topP,
            stop: mergedRequest.stop,
            stream: false
          };
        }

        const response = await this.httpClient.post(endpoint, requestBody);

        const data = response.data;
        let content: string;
        let usage: TokenUsage;

        if (this.localConfig.provider === 'ollama') {
          content = data.message?.content || '';
          usage = {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
          };
        } else {
          const choice = data.choices?.[0];
          content = choice?.message?.content || '';
          usage = {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          };
        }

        return {
          id: data.id || this.generateRequestId(),
          provider: this.provider,
          model: data.model || mergedRequest.model!,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content
            },
            finishReason: 'stop'
          }],
          usage,
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
      let endpoint = '/v1/chat/completions';
      let requestBody: any;

      if (this.localConfig.provider === 'ollama') {
        endpoint = '/api/chat';
        requestBody = {
          model: mergedRequest.model!,
          messages: mergedRequest.messages,
          stream: true,
          options: {
            temperature: mergedRequest.temperature,
            num_predict: mergedRequest.maxTokens,
            top_p: mergedRequest.topP,
            stop: mergedRequest.stop
          }
        };
      } else {
        requestBody = {
          model: mergedRequest.model!,
          messages: mergedRequest.messages,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop: mergedRequest.stop,
          stream: true
        };
      }

      const response = await this.httpClient.post(endpoint, requestBody, {
        responseType: 'stream'
      });

      const stream = response.data;
      let buffer = '';
      let promptTokens = 0;
      let completionTokens = 0;

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        if (this.localConfig.provider === 'ollama') {
          // Ollama返回JSON行
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                onChunk({
                  id: requestId,
                  provider: this.provider,
                  model: mergedRequest.model!,
                  delta: {
                    role: 'assistant',
                    content: data.message.content
                  }
                });
              }

              if (data.prompt_eval_count) {
                promptTokens = data.prompt_eval_count;
              }
              if (data.eval_count) {
                completionTokens = data.eval_count;
              }

              if (data.done) {
                const usage: TokenUsage = {
                  promptTokens,
                  completionTokens,
                  totalTokens: promptTokens + completionTokens
                };
                onComplete?.(usage);
                return;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        } else {
          // OpenAI兼容的SSE格式
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
    // 本地模型的token计数取决于具体模型,使用估算
    return Math.ceil(text.length / 4);
  }

  protected toGatewayError(error: any): AIGatewayError {
    if (error instanceof AIGatewayError) {
      return error;
    }

    const status = error.response?.status;
    const message = error.message || 'Unknown error';
    
    if (error.code === 'ECONNREFUSED') {
      return new AIGatewayError(
        'NETWORK_ERROR',
        'Cannot connect to local model server. Is it running?',
        this.provider,
        undefined,
        error
      );
    }

    if (error.code === 'ETIMEDOUT') {
      return new AIGatewayError(
        'TIMEOUT_ERROR',
        'Request timeout',
        this.provider,
        undefined,
        error
      );
    }

    if (status === 404) {
      return new AIGatewayError(
        'MODEL_NOT_FOUND',
        'Model not found. Please check if the model is loaded.',
        this.provider,
        404,
        error
      );
    }

    if (status === 400) {
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
}

// ========== 本地模型提供商配置 ==========

export const OLLAMA_CONFIG: LocalProviderConfig = {
  provider: 'ollama',
  defaultBaseUrl: 'http://localhost:11434',
  defaultModel: 'llama2'
};

export const LMSTUDIO_CONFIG: LocalProviderConfig = {
  provider: 'lmstudio',
  defaultBaseUrl: 'http://localhost:1234/v1',
  defaultModel: 'local-model'
};

export const VLLM_CONFIG: LocalProviderConfig = {
  provider: 'vllm',
  defaultBaseUrl: 'http://localhost:8000/v1',
  defaultModel: 'unknown'
};