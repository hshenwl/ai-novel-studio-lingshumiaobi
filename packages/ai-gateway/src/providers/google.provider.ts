/**
 * Google Gemini Provider - 支持Gemini Pro等模型
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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

export class GoogleProvider extends BaseProvider {
  readonly provider: AIProvider = 'google';
  private client: GoogleGenerativeAI | null = null;

  private static readonly MODEL_CAPABILITIES: Record<string, any> = {
    'gemini-pro': {
      contextWindow: 30720,
      maxOutputTokens: 2048,
      inputPricePer1K: 0.00025,
      outputPricePer1K: 0.0005
    },
    'gemini-1.5-pro': {
      contextWindow: 2097152,
      maxOutputTokens: 8192,
      inputPricePer1K: 0.00125,
      outputPricePer1K: 0.005
    },
    'gemini-1.5-flash': {
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputPricePer1K: 0.000075,
      outputPricePer1K: 0.0003
    }
  };

  async initialize(config: ModelConfig): Promise<void> {
    this.validateConfig(config);
    
    if (!config.apiKey) {
      throw new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'Google API key is required',
        this.provider
      );
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.config = config;
    this.initialized = true;
  }

  async listModels(): Promise<string[]> {
    return Object.keys(GoogleProvider.MODEL_CAPABILITIES);
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
        const model = this.client.getGenerativeModel({ 
          model: mergedRequest.model! 
        });

        // 转换消息格式
        const history = this.convertMessages(mergedRequest.messages);
        const lastMessage = history.pop();

        const result = await model.generateContent({
          contents: history,
          generationConfig: {
            temperature: mergedRequest.temperature,
            maxOutputTokens: mergedRequest.maxTokens,
            topP: mergedRequest.topP,
            stopSequences: mergedRequest.stop
          }
        });

        const response = result.response;
        const text = response.text();

        return {
          id: this.generateRequestId(),
          provider: this.provider,
          model: mergedRequest.model!,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: text
            },
            finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason)
          }],
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0
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
      const model = this.client.getGenerativeModel({ 
        model: mergedRequest.model! 
      });

      const history = this.convertMessages(mergedRequest.messages);
      history.pop();

      const result = await model.generateContentStream({
        contents: history,
        generationConfig: {
          temperature: mergedRequest.temperature,
          maxOutputTokens: mergedRequest.maxTokens,
          topP: mergedRequest.topP
        }
      });

      let totalTokens = 0;

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          onChunk({
            id: requestId,
            provider: this.provider,
            model: mergedRequest.model!,
            delta: {
              role: 'assistant',
              content: text
            }
          });
        }
      }

      const aggregatedResponse = await result.response;
      const usage: TokenUsage = {
        promptTokens: aggregatedResponse.usageMetadata?.promptTokenCount || 0,
        completionTokens: aggregatedResponse.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: aggregatedResponse.usageMetadata?.totalTokenCount || 0
      };
      
      onComplete?.(usage);
    } catch (error) {
      const gatewayError = this.toGatewayError(error);
      onError?.(gatewayError);
      throw gatewayError;
    }
  }

  async countTokens(text: string): Promise<number> {
    // Gemini的平均token长度约为4个字符
    return Math.ceil(text.length / 4);
  }

  protected toGatewayError(error: any): AIGatewayError {
    if (error instanceof AIGatewayError) {
      return error;
    }

    const message = error.message || 'Unknown error';
    
    if (message.includes('API key')) {
      return new AIGatewayError(
        'AUTHENTICATION_ERROR',
        'Invalid API key',
        this.provider,
        401,
        error
      );
    }

    if (message.includes('quota')) {
      return new AIGatewayError(
        'QUOTA_EXCEEDED',
        'Quota exceeded',
        this.provider,
        429,
        error
      );
    }

    if (message.includes('not found')) {
      return new AIGatewayError(
        'MODEL_NOT_FOUND',
        'Model not found',
        this.provider,
        404,
        error
      );
    }

    if (message.includes('safety')) {
      return new AIGatewayError(
        'CONTENT_FILTERED',
        'Content filtered by safety system',
        this.provider,
        400,
        error
      );
    }

    return new AIGatewayError(
      'PROVIDER_ERROR',
      message,
      this.provider,
      undefined,
      error
    );
  }

  private convertMessages(messages: CompletionRequest['messages']): any[] {
    const history: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Google Gemini不直接支持system消息,将其作为user消息处理
        history.push({
          role: 'user',
          parts: [{ text: `System instruction: ${msg.content}` }]
        });
      } else {
        history.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    return history;
  }

  private mapFinishReason(reason: string | undefined): FinishReason {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}