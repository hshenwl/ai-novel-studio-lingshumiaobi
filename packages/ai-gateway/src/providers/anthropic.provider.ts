/**
 * Anthropic Provider - 支持Claude 3系列模型
 */

import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider extends BaseProvider {
  readonly provider: AIProvider = 'anthropic';
  private client: Anthropic | null = null;

  // Claude模型能力映射
  private static readonly MODEL_CAPABILITIES: Record<string, any> = {
    'claude-3-opus-20240229': {
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.015,
      outputPricePer1K: 0.075
    },
    'claude-3-sonnet-20240229': {
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.003,
      outputPricePer1K: 0.015
    },
    'claude-3-haiku-20240307': {
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputPricePer1K: 0.00025,
      outputPricePer1K: 0.00125
    },
    'claude-3-5-sonnet-20241022': {
      contextWindow: 200000,
      maxOutputTokens: 8192,
      inputPricePer1K: 0.003,
      outputPricePer1K: 0.015
    }
  };

  async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);
    
    if (!config.apiKey) {
      throw new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'Anthropic API key is required',
        this.provider
      );
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3
    });

    this.config = config;
    this.initialized = true;
  }

  async listModels(): Promise<string[]> {
    return Object.keys(AnthropicProvider.MODEL_CAPABILITIES);
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
        // Anthropic使用不同的消息格式
        const systemMessage = mergedRequest.messages.find(m => m.role === 'system');
        const otherMessages = mergedRequest.messages.filter(m => m.role !== 'system');

        const response = await this.client.messages.create({
          model: mergedRequest.model!,
          system: systemMessage?.content,
          messages: otherMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          max_tokens: mergedRequest.maxTokens || 4096,
          temperature: mergedRequest.temperature,
          top_p: mergedRequest.topP,
          stop_sequences: mergedRequest.stop,
          stream: false
        });

        const content = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('');

        return {
          id: response.id,
          provider: this.provider,
          model: response.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content
            },
            finishReason: this.mapFinishReason(response.stop_reason)
          }],
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens
          },
          created: Date.now() / 1000,
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
      const systemMessage = mergedRequest.messages.find(m => m.role === 'system');
      const otherMessages = mergedRequest.messages.filter(m => m.role !== 'system');

      const stream = this.client.messages.stream({
        model: mergedRequest.model!,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        max_tokens: mergedRequest.maxTokens || 4096,
        temperature: mergedRequest.temperature,
        top_p: mergedRequest.topP,
        stop_sequences: mergedRequest.stop
      });

      stream.on('text', (text) => {
        onChunk({
          id: requestId,
          provider: this.provider,
          model: mergedRequest.model!,
          delta: {
            role: 'assistant',
            content: text
          }
        });
      });

      stream.on('end', () => {
        const finalMessage = stream.finalMessage();
        const usage: TokenUsage = {
          promptTokens: finalMessage.usage.input_tokens,
          completionTokens: finalMessage.usage.output_tokens,
          totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens
        };
        onComplete?.(usage);
      });

      stream.on('error', (error) => {
        const gatewayError = this.toGatewayError(error);
        onError?.(gatewayError);
      });

      await stream.finalMessage();
    } catch (error) {
      const gatewayError = this.toGatewayError(error);
      onError?.(gatewayError);
      throw gatewayError;
    }
  }

  async countTokens(text: string): Promise<number> {
    // Claude的平均token长度约为3.5个字符
    return Math.ceil(text.length / 3.5);
  }

  protected toGatewayError(error: any): AIGatewayError {
    if (error instanceof AIGatewayError) {
      return error;
    }

    const anthropicError = error as any;
    const status = anthropicError.status || anthropicError.httpStatusCode;
    
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
      const message = error.message || 'Invalid request';
      if (message.includes('max_tokens')) {
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
      error.message || 'Unknown error',
      this.provider,
      status,
      error
    );
  }

  private mapFinishReason(reason: string | null): FinishReason {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}