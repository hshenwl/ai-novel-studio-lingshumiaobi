/**
 * DeepReader Agent - 深度读者
 * 模拟读者体验,检查代入感、爽点、追读欲
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext
} from '../types/index.js';

/** 读者体验维度 */
interface ReaderExperienceDimension {
  name: string;
  score: number;
  description: string;
  suggestions: string[];
}

/** DeepReader输出 */
interface DeepReaderOutput {
  dimensions: ReaderExperienceDimension[];
  totalScore: number;
  immersiveQuality: number; // 代入感分数 (0-100)
  coolMomentScore: number; // 爽点分数 (0-100)
  readOnDesire: number; // 追读欲望 (0-100)
  overallFeedback: string;
  criticalIssues: string[];
  highlights: string[];
}

export class DeepReaderAgent extends BaseAgent {
  readonly name = 'DeepReader';
  readonly type = AgentType.DEEP_READER;
  
  protected entryState = WorkflowState.WRITTEN;
  protected successState = WorkflowState.DEEP_READ_DONE;
  
  /** 读者体验评估维度 */
  private readonly dimensions = [
    '代入感',
    '情感共鸣',
    '爽点体验',
    '悬念吸引力',
    '节奏感知',
    '信息吸收',
    '角色认同',
    '世界观沉浸',
    '追读欲望',
    '阅读疲劳度'
  ];
  
  protected async run(context: AgentContext): Promise<DeepReaderOutput> {
    const content = context.content!;
    
    // 1. 模拟读者阅读
    const readingSimulation = await this.simulateReading(content);
    
    // 2. 评估各维度
    const dimensions = await this.evaluateDimensions(content, readingSimulation);
    
    // 3. 计算关键指标
    const immersiveQuality = this.calculateImmersiveQuality(dimensions);
    const coolMomentScore = this.calculateCoolMomentScore(dimensions);
    const readOnDesire = this.calculateReadOnDesire(dimensions);
    
    // 4. 计算总分
    const totalScore = this.calculateTotalScore(dimensions);
    
    // 5. 识别关键问题
    const criticalIssues = this.identifyCriticalIssues(dimensions);
    
    // 6. 识别亮点
    const highlights = this.identifyHighlights(dimensions);
    
    // 7. 生成整体反馈
    const overallFeedback = this.generateOverallFeedback(
      dimensions,
      immersiveQuality,
      coolMomentScore,
      readOnDesire
    );
    
    return {
      dimensions,
      totalScore,
      immersiveQuality,
      coolMomentScore,
      readOnDesire,
      overallFeedback,
      criticalIssues,
      highlights
    };
  }
  
  /** 模拟读者阅读体验 */
  private async simulateReading(content: string): Promise<Record<string, unknown>> {
    // TODO: 实现实际的模拟逻辑
    // 分析内容结构、情感曲线、节奏变化等
    return {
      paragraphs: content.split('\n').length,
      dialogueRatio: this.calculateDialogueRatio(content),
      descriptionRatio: this.calculateDescriptionRatio(content),
      emotionalPeaks: [],
      tensionPoints: []
    };
  }
  
  /** 计算对话比例 */
  private calculateDialogueRatio(content: string): number {
    const dialogueMatches = content.match(/"[^"]*"|"[^"]*"|「[^」]*」/g) || [];
    const totalLength = content.length;
    return dialogueMatches.reduce((sum, d) => sum + d.length, 0) / totalLength;
  }
  
  /** 计算描写比例 */
  private calculateDescriptionRatio(content: string): number {
    // 简化的描写识别
    const descriptivePhrases = content.match(/（[^）]*）|\([^)]*\)|\[[^\]]*\]/g) || [];
    return descriptivePhrases.length / (content.split('\n').length || 1);
  }
  
  /** 评估各维度 */
  private async evaluateDimensions(
    content: string,
    simulation: Record<string, unknown>
  ): Promise<ReaderExperienceDimension[]> {
    const results: ReaderExperienceDimension[] = [];
    
    for (const dimensionName of this.dimensions) {
      const evaluation = await this.evaluateDimension(dimensionName, content, simulation);
      results.push(evaluation);
    }
    
    return results;
  }
  
  /** 评估单个维度 */
  private async evaluateDimension(
    name: string,
    content: string,
    simulation: Record<string, unknown>
  ): Promise<ReaderExperienceDimension> {
    // TODO: 实现实际的维度评估
    // 这里返回模拟结果
    
    let score = 75;
    let description = '';
    let suggestions: string[] = [];
    
    switch (name) {
      case '代入感':
        score = 80;
        description = '读者能较好地代入角色视角';
        suggestions = ['可以增加更多感官描写以增强代入感'];
        break;
      
      case '情感共鸣':
        score = 75;
        description = '情感表达有一定共鸣点';
        suggestions = ['加强情感细节描写，让读者更深入感受'];
        break;
      
      case '爽点体验':
        score = 85;
        description = '爽点设置有效，但分布可更均匀';
        suggestions = ['建议在章节中期增加一个高潮点'];
        break;
      
      case '悬念吸引力':
        score = 90;
        description = '结尾悬念设置吸引人';
        suggestions = [];
        break;
      
      case '节奏感知':
        score = 70;
        description = '节奏略显平淡，缺乏明显起伏';
        suggestions = ['建议调整节奏，增加紧张-放松的节奏变化'];
        break;
      
      case '信息吸收':
        score = 85;
        description = '信息披露适度，读者易于吸收';
        suggestions = [];
        break;
      
      case '角色认同':
        score = 80;
        description = '主角形象鲜明，读者有一定认同感';
        suggestions = ['可以通过更多内心独白加深角色认同'];
        break;
      
      case '世界观沉浸':
        score = 75;
        description = '世界观有一定呈现';
        suggestions = ['建议增加环境描写以强化沉浸感'];
        break;
      
      case '追读欲望':
        score = 82;
        description = '结尾悬念有效激发了追读欲望';
        suggestions = [];
        break;
      
      case '阅读疲劳度':
        score = 88;
        description = '阅读流畅，无明显疲劳点';
        suggestions = [];
        break;
    }
    
    return {
      name,
      score,
      description,
      suggestions
    };
  }
  
  /** 计算代入感分数 */
  private calculateImmersiveQuality(dimensions: ReaderExperienceDimension[]): number {
    const relevantDimensions = ['代入感', '角色认同', '世界观沉浸'];
    return this.calculateWeightedAverage(dimensions, relevantDimensions, [0.4, 0.3, 0.3]);
  }
  
  /** 计算爽点分数 */
  private calculateCoolMomentScore(dimensions: ReaderExperienceDimension[]): number {
    const relevantDimensions = ['爽点体验', '情感共鸣', '节奏感知'];
    return this.calculateWeightedAverage(dimensions, relevantDimensions, [0.5, 0.3, 0.2]);
  }
  
  /** 计算追读欲望 */
  private calculateReadOnDesire(dimensions: ReaderExperienceDimension[]): number {
    const relevantDimensions = ['悬念吸引力', '爽点体验', '追读欲望'];
    return this.calculateWeightedAverage(dimensions, relevantDimensions, [0.4, 0.3, 0.3]);
  }
  
  /** 加权平均计算 */
  private calculateWeightedAverage(
    dimensions: ReaderExperienceDimension[],
    names: string[],
    weights: number[]
  ): number {
    let sum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < names.length; i++) {
      const dim = dimensions.find(d => d.name === names[i]);
      if (dim) {
        sum += dim.score * weights[i];
        weightSum += weights[i];
      }
    }
    
    return Math.round(sum / weightSum);
  }
  
  /** 计算总分 */
  private calculateTotalScore(dimensions: ReaderExperienceDimension[]): number {
    return Math.round(
      dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
    );
  }
  
  /** 识别关键问题 */
  private identifyCriticalIssues(dimensions: ReaderExperienceDimension[]): string[] {
    return dimensions
      .filter(d => d.score < 70)
      .map(d => `${d.name}: ${d.description} (分数: ${d.score})`);
  }
  
  /** 识别亮点 */
  private identifyHighlights(dimensions: ReaderExperienceDimension[]): string[] {
    return dimensions
      .filter(d => d.score >= 85)
      .map(d => `${d.name}: ${d.description} (分数: ${d.score})`);
  }
  
  /** 生成整体反馈 */
  private generateOverallFeedback(
    dimensions: ReaderExperienceDimension[],
    immersiveQuality: number,
    coolMomentScore: number,
    readOnDesire: number
  ): string {
    const avgScore = this.calculateTotalScore(dimensions);
    
    let feedback = `读者体验总体评分: ${avgScore}/100\n`;
    feedback += `代入感: ${immersiveQuality}/100, `;
    feedback += `爽点体验: ${coolMomentScore}/100, `;
    feedback += `追读欲望: ${readOnDesire}/100\n\n`;
    
    feedback += '综合评价: ';
    if (avgScore >= 80) {
      feedback += '读者体验良好，章节整体吸引力较强。';
    } else if (avgScore >= 70) {
      feedback += '读者体验中等，有提升空间。';
    } else {
      feedback += '读者体验欠佳，建议重点改进。';
    }
    
    return feedback;
  }
}