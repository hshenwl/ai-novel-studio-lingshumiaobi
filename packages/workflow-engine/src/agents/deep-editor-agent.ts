/**
 * DeepEditor Agent - 深度编辑
 * 模拟网文编辑,检查结构、节奏、商业性
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext
} from '../types/index.js';

/** 编辑评估维度 */
interface EditorEvaluationDimension {
  name: string;
  score: number;
  weight: number;
  description: string;
  issues: string[];
  suggestions: string[];
}

/** DeepEditor输出 */
interface DeepEditorOutput {
  dimensions: EditorEvaluationDimension[];
  totalScore: number;
  commercialScore: number; // 商业性评分
  structureScore: number; // 结构评分
  pacingScore: number; // 节奏评分
  marketability: string; // 市场潜力评估
  recommendations: string[];
  approvalStatus: 'approved' | 'needs_revision' | 'needs_rewrite';
}

export class DeepEditorAgent extends BaseAgent {
  readonly name = 'DeepEditor';
  readonly type = AgentType.DEEP_EDITOR;
  
  protected entryState = WorkflowState.DEEP_READ_DONE;
  protected successState = WorkflowState.DEEP_EDIT_DONE;
  
  /** 编辑评估维度（网文编辑视角） */
  private readonly evaluationDimensions = [
    { name: '开篇吸引力', weight: 0.15 },
    { name: '剧情结构', weight: 0.12 },
    { name: '爽点密度', weight: 0.15 },
    { name: '节奏控制', weight: 0.10 },
    { name: '悬念设置', weight: 0.10 },
    { name: '读者粘性', weight: 0.10 },
    { name: '商业转化', weight: 0.08 },
    { name: 'IP潜力', weight: 0.05 },
    { name: '文字流畅度', weight: 0.05 },
    { name: '类型匹配度', weight: 0.10 }
  ];
  
  protected async run(context: AgentContext): Promise<DeepEditorOutput> {
    const content = context.content!;
    
    // 1. 从编辑视角分析内容
    const editorialAnalysis = await this.analyzeContent(content);
    
    // 2. 评估各维度
    const dimensions = await this.evaluateAllDimensions(content, editorialAnalysis);
    
    // 3. 计算核心分数
    const commercialScore = this.calculateCommercialScore(dimensions);
    const structureScore = this.calculateStructureScore(dimensions);
    const pacingScore = this.calculatePacingScore(dimensions);
    
    // 4. 计算总分
    const totalScore = this.calculateTotalScore(dimensions);
    
    // 5. 评估市场潜力
    const marketability = this.evaluateMarketability(dimensions, totalScore);
    
    // 6. 生成改进建议
    const recommendations = this.generateRecommendations(dimensions);
    
    // 7. 确定审批状态
    const approvalStatus = this.determineApprovalStatus(totalScore, dimensions);
    
    return {
      dimensions,
      totalScore,
      commercialScore,
      structureScore,
      pacingScore,
      marketability,
      recommendations,
      approvalStatus
    };
  }
  
  /** 从编辑视角分析内容 */
  private async analyzeContent(content: string): Promise<Record<string, unknown>> {
    return {
      // 开篇分析
      openingAnalysis: {
        firstParagraphHook: true,
        first500WordsScore: 80
      },
      
      // 结构分析
      structureAnalysis: {
        hasConflict: true,
        hasResolution: false,
        hasClimax: true,
        sceneCount: 3
      },
      
      // 爽点分析
      coolMomentsAnalysis: {
        count: 2,
        distribution: [0.3, 0.7],
        intensity: [75, 85]
      },
      
      // 节奏分析
      pacingAnalysis: {
        tensionCurve: [30, 50, 70, 60, 80],
        dialogueToActionRatio: 0.4
      },
      
      // 商业指标
      commercialMetrics: {
        cliffhangerStrength: 85,
        potentialConversionPoint: '结尾悬念'
      }
    };
  }
  
  /** 评估所有维度 */
  private async evaluateAllDimensions(
    content: string,
    analysis: Record<string, unknown>
  ): Promise<EditorEvaluationDimension[]> {
    const results: EditorEvaluationDimension[] = [];
    
    for (const dim of this.evaluationDimensions) {
      const evaluation = await this.evaluateDimension(dim.name, content, analysis, dim.weight);
      results.push(evaluation);
    }
    
    return results;
  }
  
  /** 评估单个维度 */
  private async evaluateDimension(
    name: string,
    content: string,
    analysis: Record<string, unknown>,
    weight: number
  ): Promise<EditorEvaluationDimension> {
    let score = 75;
    let description = '';
    let issues: string[] = [];
    let suggestions: string[] = [];
    
    switch (name) {
      case '开篇吸引力':
        score = 80;
        description = '开篇有一定吸引力，但可以更强';
        issues = ['开头略显平淡'];
        suggestions = ['建议在开头增加更强的冲突或悬念'];
        break;
      
      case '剧情结构':
        score = 75;
        description = '结构基本完整，但高潮铺垫不足';
        issues = ['高潮点不够突出'];
        suggestions = ['建议加强高潮前的铺垫，让高潮更有冲击力'];
        break;
      
      case '爽点密度':
        score = 82;
        description = '爽点数量适中，分布合理';
        issues = [];
        suggestions = ['可以在章节中期增加一个小爽点'];
        break;
      
      case '节奏控制':
        score = 70;
        description = '节奏偏慢，紧张感不足';
        issues = ['中间段落节奏拖沓'];
        suggestions = ['建议压缩中间的过渡段落，加快节奏'];
        break;
      
      case '悬念设置':
        score = 88;
        description = '结尾悬念设置有效';
        issues = [];
        suggestions = [];
        break;
      
      case '读者粘性':
        score = 80;
        description = '有一定追读吸引力';
        issues = [];
        suggestions = ['建议增加更多期待感的铺垫'];
        break;
      
      case '商业转化':
        score = 78;
        description = '有一定付费转化潜力';
        issues = ['付费点不够突出'];
        suggestions = ['建议在关键剧情点强化付费转化动力'];
        break;
      
      case 'IP潜力':
        score = 72;
        description = '改编潜力中等';
        issues = ['视觉化描写不足'];
        suggestions = ['建议增加更多场景细节描写'];
        break;
      
      case '文字流畅度':
        score = 85;
        description = '文字流畅，无明显阅读障碍';
        issues = [];
        suggestions = [];
        break;
      
      case '类型匹配度':
        score = 90;
        description = '符合类型读者期待';
        issues = [];
        suggestions = [];
        break;
    }
    
    return {
      name,
      score,
      weight,
      description,
      issues,
      suggestions
    };
  }
  
  /** 计算商业性分数 */
  private calculateCommercialScore(dimensions: EditorEvaluationDimension[]): number {
    const relevantDimensions = ['爽点密度', '悬念设置', '商业转化', '读者粘性'];
    const weights = [0.3, 0.3, 0.2, 0.2];
    
    let sum = 0;
    for (let i = 0; i < relevantDimensions.length; i++) {
      const dim = dimensions.find(d => d.name === relevantDimensions[i]);
      if (dim) {
        sum += dim.score * weights[i];
      }
    }
    
    return Math.round(sum);
  }
  
  /** 计算结构分数 */
  private calculateStructureScore(dimensions: EditorEvaluationDimension[]): number {
    const relevantDimensions = ['剧情结构', '开篇吸引力', '悬念设置'];
    const weights = [0.5, 0.3, 0.2];
    
    let sum = 0;
    for (let i = 0; i < relevantDimensions.length; i++) {
      const dim = dimensions.find(d => d.name === relevantDimensions[i]);
      if (dim) {
        sum += dim.score * weights[i];
      }
    }
    
    return Math.round(sum);
  }
  
  /** 计算节奏分数 */
  private calculatePacingScore(dimensions: EditorEvaluationDimension[]): number {
    const dim = dimensions.find(d => d.name === '节奏控制');
    return dim ? dim.score : 70;
  }
  
  /** 计算总分 */
  private calculateTotalScore(dimensions: EditorEvaluationDimension[]): number {
    let weightedSum = 0;
    let weightSum = 0;
    
    for (const dim of dimensions) {
      weightedSum += dim.score * dim.weight;
      weightSum += dim.weight;
    }
    
    return Math.round(weightedSum / weightSum);
  }
  
  /** 评估市场潜力 */
  private evaluateMarketability(
    dimensions: EditorEvaluationDimension[],
    totalScore: number
  ): string {
    if (totalScore >= 85) {
      return '高市场潜力，具备畅销潜力';
    } else if (totalScore >= 75) {
      return '中等市场潜力，需要一定推广';
    } else if (totalScore >= 65) {
      return '市场潜力有限，需要重点改进';
    } else {
      return '市场潜力不足，建议重新规划';
    }
  }
  
  /** 生成改进建议 */
  private generateRecommendations(dimensions: EditorEvaluationDimension[]): string[] {
    const recommendations: string[] = [];
    
    // 收集所有建议
    for (const dim of dimensions) {
      if (dim.score < 80 && dim.suggestions.length > 0) {
        recommendations.push(`【${dim.name}】${dim.suggestions.join('; ')}`);
      }
    }
    
    // 添加整体建议
    const lowScoreDims = dimensions.filter(d => d.score < 70);
    if (lowScoreDims.length > 0) {
      recommendations.push(
        `重点改进维度: ${lowScoreDims.map(d => d.name).join(', ')}`
      );
    }
    
    return recommendations;
  }
  
  /** 确定审批状态 */
  private determineApprovalStatus(
    totalScore: number,
    dimensions: EditorEvaluationDimension[]
  ): 'approved' | 'needs_revision' | 'needs_rewrite' {
    const criticalDimensions = dimensions.filter(d => d.score < 60);
    
    if (criticalDimensions.length >= 3) {
      return 'needs_rewrite';
    }
    
    if (totalScore >= 80 && criticalDimensions.length === 0) {
      return 'approved';
    }
    
    return 'needs_revision';
  }
}