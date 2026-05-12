/**
 * 日志服务 - 支持脱敏处理
 */

import winston from 'winston';
import { LogConfig, DEFAULT_LOG_CONFIG } from '../types';

export class Logger {
  private logger: winston.Logger;
  private config: LogConfig;
  private sensitivePatterns: RegExp[];

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...DEFAULT_LOG_CONFIG, ...config };
    this.sensitivePatterns = [
      /sk-[a-zA-Z0-9]{20,}/g,           // OpenAI API keys
      /sk-ant-[a-zA-Z0-9-]{20,}/g,      // Anthropic API keys
      /AIza[a-zA-Z0-9_-]{35}/g,         // Google API keys
      /[a-f0-9]{32}/g,                   // MD5-like tokens
      /Bearer\s+[a-zA-Z0-9-._~+/]+=*/g, // Bearer tokens
      /api[_-]?key['":\s]*['"][^'"]+['"]/gi  // API key in JSON
    ];

    this.logger = winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ai-gateway' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log' 
        })
      ]
    });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, this.sanitizeMeta(meta));
  }

  /**
   * 记录API请求
   */
  logRequest(
    provider: string,
    model: string,
    messages: any[],
    params: any
  ): void {
    if (!this.config.logRequests) return;

    const sanitizedMessages = this.sanitizeMessages(messages);
    
    this.info('API Request', {
      provider,
      model,
      messageCount: messages.length,
      messages: this.config.enableSensitiveDataLogging 
        ? sanitizedMessages 
        : '[REDACTED]',
      params: this.sanitizeParams(params)
    });
  }

  /**
   * 记录API响应
   */
  logResponse(
    provider: string,
    model: string,
    response: any,
    latency: number
  ): void {
    if (!this.config.logResponses) return;

    this.info('API Response', {
      provider,
      model,
      latency,
      response: this.config.enableSensitiveDataLogging 
        ? this.sanitizeResponse(response) 
        : '[REDACTED]'
    });
  }

  /**
   * 记录Token使用
   */
  logTokenUsage(
    provider: string,
    model: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  ): void {
    if (!this.config.logTokenUsage) return;

    this.info('Token Usage', {
      provider,
      model,
      ...usage
    });
  }

  /**
   * 记录错误
   */
  logError(
    provider: string,
    error: Error,
    context?: any
  ): void {
    this.error('API Error', {
      provider,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: this.sanitizeMeta(context)
    });
  }

  /**
   * 清理敏感信息
   */
  private sanitize(text: string): string {
    if (this.config.enableSensitiveDataLogging) {
      return text;
    }

    let sanitized = text;
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }

  /**
   * 清理元数据
   */
  private sanitizeMeta(meta: any): any {
    if (!meta) return meta;
    
    if (typeof meta === 'string') {
      return this.sanitize(meta);
    }

    if (typeof meta === 'object') {
      const sanitized: any = Array.isArray(meta) ? [] : {};
      
      for (const key in meta) {
        if (typeof meta[key] === 'string') {
          sanitized[key] = this.sanitize(meta[key]);
        } else if (typeof meta[key] === 'object') {
          sanitized[key] = this.sanitizeMeta(meta[key]);
        } else {
          sanitized[key] = meta[key];
        }
      }
      
      return sanitized;
    }

    return meta;
  }

  /**
   * 清理消息内容
   */
  private sanitizeMessages(messages: any[]): any[] {
    if (this.config.enableSensitiveDataLogging) {
      return messages;
    }

    return messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' 
        ? this.sanitize(msg.content).substring(0, 100) + '...'
        : '[COMPLEX]'
    }));
  }

  /**
   * 清理参数
   */
  private sanitizeParams(params: any): any {
    const sanitized = { ...params };
    
    // 移除敏感字段
    delete sanitized.apiKey;
    delete sanitized.api_key;
    delete sanitized.token;
    delete sanitized.authorization;

    return sanitized;
  }

  /**
   * 清理响应
   */
  private sanitizeResponse(response: any): any {
    if (!response) return response;

    return {
      id: response.id,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      latency: response.latency
    };
  }
}

// 创建默认logger实例
export const logger = new Logger();