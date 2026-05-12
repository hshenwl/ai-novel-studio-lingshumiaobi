/**
 * 自定义API提供商 - 支持任何OpenAI兼容接口
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
  AIGatewayError
} from '../types';

export class CustomProvider extends BaseProvider {
  readonly provider: AIProvider = 'custom';
  private httpClient: AxiosInstance | null = null;

  async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);
    
    if (!config.baseUrl) {
      throw new AIGatewayError(
        'INVALID_REQUEST',
        'Base URL is required for custom provider',
        this.provider
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // 支持不同的认证方式
    if (config.apiKey) {
      if (config.metadata?.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.metadata?.authType === 'header') {
        headers[config.metadata?.authHeader || 'X-API-Key'] = config.apiKey;
      } else {
        // 默认使用Bearer token
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
    }

    // 添加自定义headers
    if (config.metadata?.headers) {
      Object.assign(headers, config.metadata.headers);
    }

    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      headers,
      timeout: config.timeout || 60000
    });

    this.config = config;
    this.initialized = true;
  }

  async listModels(): Promise<string[]> {
    if (!this.httpClient) {
      return [];
    }

    try {
      const response = await this.httpClient.get('/models');
      return response.data.data?.map((m: any) => m.id) || [];
    } catch {
      // 如果API不支持列出模型,返回配置的模型
      return this.config?.model ? [this.config.model] : [];
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
        const endpoint = this.config.metadata?.endpoint || '/chat/completions';
        
        const requestBody: any = {
          model: mergedRequest.model!,
          messages: mergedRequest.messages,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop: mergedRequest.stop,
          stream: false
        };

        // 允许添加自定义参数
        if (this.config.metadata?.extraParams) {
          Object.assign(requestBody, this.config.metadata.extraParams);
        }

        const response = await this.httpClient.post(endpoint, requestBody);

        const data = response.data;
        const choice = data.choices?.[0];

        return {
          id: data.id || this.generateRequestId(),
          provider: this.provider,
          model: data.model || mergedRequest.model!,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: choice?.message?.content || ''
            },
            finishReason: choice?.finish_reason || 'stop'
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
      const endpoint = this.config.metadata?.endpoint || '/chat/completions';
      
      const requestBody: any = {
        model: mergedRequest.model!,
        messages: mergedRequest.messages,
        temperature: mergedRequest.temperature,
        max_tokens: mergedRequest.maxTokens,
        top_p: mergedRequest.topP,
        stop: mergedRequest.stop,
        stream: true
      };

      if (this.config.metadata?.extraParams) {
        Object.assign(requestBody, this.config.metadata.extraParams);
      }

      const response = await this.httpClient.post(endpoint, requestBody, {
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
    return Math.ceil(text.length / 4);
  }

  protected toGatewayError(error: any): AIGatewayError {
    if (error instanceof AIGatewayError) {
      return error;
    }

    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message || 'Unknown error';
    
    if (status === 401 || status === 403) {
      return new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'Authentication failed',
        this.provider,
        status,
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
        'Endpoint or model not found',
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

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new AIGatewayError(
        'NETWORK_ERROR',
        'Cannot connect to API endpoint',
        this.provider,
        undefined,
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