/**
 * OpenAI Provider - 支持GPT-4, GPT-3.5等模型
 */

import OpenAI from 'openai';
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

export class OpenAIProvider extends BaseProvider {
  readonly provider: AIProvider = 'openai';
  private client: OpenAI | null = null;

  // OpenAI模型能力映射
  private static readonly MODEL_CAPABILITIES: Record<string, any> = {
    'gpt-4': {
      contextWindow: 8192,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.03,
      outputPricePer1K: 0.06
    },
    'gpt-4-turbo': {
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.01,
      outputPricePer1K: 0.03
    },
    'gpt-4o': {
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.005,
      outputPricePer1K: 0.015
    },
    'gpt-4o-mini': {
      contextWindow: 128000,
      maxOutputTokens: 16384,
      inputPricePer1K: 0.00015,
      outputPricePer1K: 0.0006
    },
    'gpt-3.5-turbo': {
      contextWindow: 16385,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.0005,
      outputPricePer1K: 0.0015
    }
  };

  async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);
    
    if (!config.apiKey) {
      throw new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'OpenAI API key is required',
        this.provider
      );
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.openai.com/v1',
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3
    });

    this.config = config;
    this.initialized = true;
  }

  async listModels(): Promise<string[]> {
    if (!this.client) {
      throw new AIGatewayError(
        'INVALID_REQUEST',
        'Provider not initialized',
        this.provider
      );
    }

    try {
      const response = await this.client.models.list();
      return response.data
        .map(model => model.id)
        .filter(id => id.startsWith('gpt-'));
    } catch (error) {
      // 如果API调用失败，返回预定义的模型列表
      return Object.keys(OpenAIProvider.MODEL_CAPABILITIES);
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    return this.withRetry(async () => {
      if (!this.client || !this.config) {
        throw new AIGatewayError(
          'INVALID_REQUEST',
          'Provider not initialized',
          this.provider
        );
      }

      const mergedRequest = this.mergeRequestParams(request, this.config);
      const startTime = Date.now();

      try {
        const response = await this.client.chat.completions.create({
          model: mergedRequest.model!,
          messages: mergedRequest.messages as any,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop: mergedRequest.stop,
          stream: false
        });

        const choice = response.choices[0];
        
        return {
          id: response.id,
          provider: this.provider,
          model: response.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: choice.message.content || ''
            },
            finishReason: this.mapFinishReason(choice.finish_reason)
          }],
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          created: response.created,
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
    if (!this.client || !this.config) {
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
      const stream = await this.client.chat.completions.create({
        model: mergedRequest.model!,
        messages: mergedRequest.messages as any,
        temperature: mergedRequest.temperature,
        max_tokens: mergedRequest.maxTokens,
        top_p: mergedRequest.topP,
        stop: mergedRequest.stop,
        stream: true
      });

      let totalContent = '';
      
      for await (const chunk of stream as any) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          totalContent += delta.content;
          onChunk({
            id: requestId,
            provider: this.provider,
            model: mergedRequest.model!,
            delta: {
              role: 'assistant',
              content: delta.content
            },
            finishReason: chunk.choices[0]?.finish_reason 
              ? this.mapFinishReason(chunk.choices[0].finish_reason)
              : undefined
          });
        }

        if (chunk.choices[0]?.finish_reason) {
          const usage: TokenUsage = {
            promptTokens: 0, // OpenAI流式响应不返回token使用量
            completionTokens: 0,
            totalTokens: 0
          };
          onComplete?.(usage);
        }
      }
    } catch (error) {
      const gatewayError = this.toGatewayError(error);
      onError?.(gatewayError);
      throw gatewayError;
    }
  }

  async countTokens(text: string): Promise<number> {
    // 简化的token计数: 平均每个token约4个字符
    // 实际应用中应使用tiktoken库
    return Math.ceil(text.length / 4);
  }

  protected toGatewayError(error: any): AIGatewayError {
    if (error instanceof AIGatewayError) {
      return error;
    }

    const openAIError = error as OpenAI.APIError;
    
    if (openAIError.status === 401) {
      return new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'Invalid API key',
        this.provider,
        401,
        error
      );
    }

    if (openAIError.status === 429) {
      return new AIGatewayError(
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded',
        this.provider,
        429,
        error
      );
    }

    if (openAIError.status === 404) {
      return new AIGatewayError(
        'MODEL_NOT_FOUND',
        'Model not found',
        this.provider,
        404,
        error
      );
    }

    if (openAIError.status === 400) {
      const message = error.message || 'Invalid request';
      if (message.includes('context length')) {
        return new AIGatewayError(
          'CONTEXT_LENGTH_EXCEEDED',
          'Context length exceeded',
          this.provider,
          400,
          error
        );
      }
      if (message.includes('content filter')) {
        return new AIGatewayError(
          'CONTENT_FILTERED',
          'Content filtered by safety system',
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

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return new AIGatewayError(
        'NETWORK_ERROR',
        'Network error',
        this.provider,
        undefined,
        error
      );
    }

    return new AIGatewayError(
      'PROVIDER_ERROR',
      error.message || 'Unknown error',
      this.provider,
      openAIError.status,
      error
    );
  }

  private mapFinishReason(reason: string | null): FinishReason {
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