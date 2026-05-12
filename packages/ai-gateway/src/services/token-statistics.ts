/**
 * Token统计服务
 */

import { TokenUsage, CostBreakdown, ModelPricing, AIProvider } from '../types';

export class TokenStatistics {
  private usageHistory: UsageRecord[] = [];
  private dailyStats: Map<string, DailyStats> = new Map();

  /**
   * 记录Token使用
   */
  recordUsage(
    provider: AIProvider,
    model: string,
    usage: TokenUsage,
    userId?: string,
    conversationId?: string
  ): void {
    const record: UsageRecord = {
      timestamp: Date.now(),
      provider,
      model,
      usage,
      userId,
      conversationId
    };

    this.usageHistory.push(record);
    this.updateDailyStats(record);
  }

  /**
   * 获取今日使用统计
   */
  getTodayStats(): DailyStats {
    const today = this.getDateKey(Date.now());
    return this.dailyStats.get(today) || this.createEmptyStats();
  }

  /**
   * 获取指定日期的使用统计
   */
  getStatsByDate(timestamp: number): DailyStats {
    const dateKey = this.getDateKey(timestamp);
    return this.dailyStats.get(dateKey) || this.createEmptyStats();
  }

  /**
   * 获取用户使用统计
   */
  getStatsByUser(userId: string, days: number = 30): UserStats {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const userRecords = this.usageHistory.filter(
      r => r.userId === userId && r.timestamp >= cutoff
    );

    return {
      userId,
      totalTokens: userRecords.reduce((sum, r) => sum + r.usage.totalTokens, 0),
      totalPromptTokens: userRecords.reduce((sum, r) => sum + r.usage.promptTokens, 0),
      totalCompletionTokens: userRecords.reduce((sum, r) => sum + r.usage.completionTokens, 0),
      requestCount: userRecords.length,
      models: this.groupByModel(userRecords)
    };
  }

  /**
   * 获取模型使用统计
   */
  getStatsByModel(model: string, days: number = 30): ModelStats {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const modelRecords = this.usageHistory.filter(
      r => r.model === model && r.timestamp >= cutoff
    );

    return {
      model,
      totalTokens: modelRecords.reduce((sum, r) => sum + r.usage.totalTokens, 0),
      requestCount: modelRecords.length,
      avgLatency: this.calculateAvgLatency(modelRecords)
    };
  }

  /**
   * 清理过期记录
   */
  cleanup(daysToKeep: number = 90): void {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.usageHistory = this.usageHistory.filter(r => r.timestamp >= cutoff);
    
    // 清理旧的日统计
    for (const key of this.dailyStats.keys()) {
      const [year, month, day] = key.split('-').map(Number);
      const date = new Date(year, month - 1, day).getTime();
      if (date < cutoff) {
        this.dailyStats.delete(key);
      }
    }
  }

  private updateDailyStats(record: UsageRecord): void {
    const dateKey = this.getDateKey(record.timestamp);
    let stats = this.dailyStats.get(dateKey) || this.createEmptyStats();

    stats.totalTokens += record.usage.totalTokens;
    stats.totalPromptTokens += record.usage.promptTokens;
    stats.totalCompletionTokens += record.usage.completionTokens;
    stats.requestCount += 1;

    // 按提供商统计
    if (!stats.byProvider[record.provider]) {
      stats.byProvider[record.provider] = {
        tokens: 0,
        requests: 0
      };
    }
    stats.byProvider[record.provider].tokens += record.usage.totalTokens;
    stats.byProvider[record.provider].requests += 1;

    // 按模型统计
    if (!stats.byModel[record.model]) {
      stats.byModel[record.model] = {
        tokens: 0,
        requests: 0
      };
    }
    stats.byModel[record.model].tokens += record.usage.totalTokens;
    stats.byModel[record.model].requests += 1;

    this.dailyStats.set(dateKey, stats);
  }

  private getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private createEmptyStats(): DailyStats {
    return {
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      requestCount: 0,
      byProvider: {},
      byModel: {}
    };
  }

  private groupByModel(records: UsageRecord[]): Record<string, { tokens: number; requests: number }> {
    return records.reduce((acc, r) => {
      if (!acc[r.model]) {
        acc[r.model] = { tokens: 0, requests: 0 };
      }
      acc[r.model].tokens += r.usage.totalTokens;
      acc[r.model].requests += 1;
      return acc;
    }, {} as Record<string, { tokens: number; requests: number }>);
  }

  private calculateAvgLatency(records: UsageRecord[]): number {
    // 这里需要实际记录延迟时间
    return 0;
  }
}

interface UsageRecord {
  timestamp: number;
  provider: AIProvider;
  model: string;
  usage: TokenUsage;
  userId?: string;
  conversationId?: string;
}

interface DailyStats {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  requestCount: number;
  byProvider: Record<AIProvider, { tokens: number; requests: number }>;
  byModel: Record<string, { tokens: number; requests: number }>;
}

interface UserStats {
  userId: string;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  requestCount: number;
  models: Record<string, { tokens: number; requests: number }>;
}

interface ModelStats {
  model: string;
  totalTokens: number;
  requestCount: number;
  avgLatency: number;
}

/**
 * 成本计算服务
 */
export class CostCalculator {
  private pricing: Map<string, ModelPricing> = new Map();

  constructor() {
    this.initializePricing();
  }

  /**
   * 计算成本
   */
  calculate(usage: TokenUsage, model: string): CostBreakdown {
    const pricing = this.pricing.get(model) || { inputPricePer1K: 0, outputPricePer1K: 0 };
    
    const promptCost = (usage.promptTokens / 1000) * pricing.inputPricePer1K;
    const completionCost = (usage.completionTokens / 1000) * pricing.outputPricePer1K;
    const totalCost = promptCost + completionCost;

    return {
      promptCost,
      completionCost,
      totalCost,
      currency: 'USD'
    };
  }

  /**
   * 获取模型定价
   */
  getPricing(model: string): ModelPricing {
    return this.pricing.get(model) || { inputPricePer1K: 0, outputPricePer1K: 0 };
  }

  /**
   * 设置模型定价
   */
  setPricing(model: string, pricing: ModelPricing): void {
    this.pricing.set(model, pricing);
  }

  private initializePricing(): void {
    // OpenAI定价
    this.pricing.set('gpt-4', { inputPricePer1K: 0.03, outputPricePer1K: 0.06 });
    this.pricing.set('gpt-4-turbo', { inputPricePer1K: 0.01, outputPricePer1K: 0.03 });
    this.pricing.set('gpt-4o', { inputPricePer1K: 0.005, outputPricePer1K: 0.015 });
    this.pricing.set('gpt-4o-mini', { inputPricePer1K: 0.00015, outputPricePer1K: 0.0006 });
    this.pricing.set('gpt-3.5-turbo', { inputPricePer1K: 0.0005, outputPricePer1K: 0.0015 });

    // Anthropic定价
    this.pricing.set('claude-3-opus-20240229', { inputPricePer1K: 0.015, outputPricePer1K: 0.075 });
    this.pricing.set('claude-3-sonnet-20240229', { inputPricePer1K: 0.003, outputPricePer1K: 0.015 });
    this.pricing.set('claude-3-haiku-20240307', { inputPricePer1K: 0.00025, outputPricePer1K: 0.00125 });
    this.pricing.set('claude-3-5-sonnet-20241022', { inputPricePer1K: 0.003, outputPricePer1K: 0.015 });

    // Google定价
    this.pricing.set('gemini-pro', { inputPricePer1K: 0.00025, outputPricePer1K: 0.0005 });
    this.pricing.set('gemini-1.5-pro', { inputPricePer1K: 0.00125, outputPricePer1K: 0.005 });
    this.pricing.set('gemini-1.5-flash', { inputPricePer1K: 0.000075, outputPricePer1K: 0.0003 });

    // 国产模型定价
    this.pricing.set('qwen-max', { inputPricePer1K: 0.002, outputPricePer1K: 0.006 });
    this.pricing.set('qwen-plus', { inputPricePer1K: 0.0004, outputPricePer1K: 0.0012 });
    this.pricing.set('qwen-turbo', { inputPricePer1K: 0.0002, outputPricePer1K: 0.0006 });
    this.pricing.set('glm-4', { inputPricePer1K: 0.001, outputPricePer1K: 0.001 });
    this.pricing.set('deepseek-chat', { inputPricePer1K: 0.00014, outputPricePer1K: 0.00028 });
  }
}