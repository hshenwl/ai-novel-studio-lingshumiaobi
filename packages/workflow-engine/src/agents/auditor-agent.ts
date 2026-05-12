/**
 * Auditor Agent - 审核器
 * 执行20维度审核,判断PASS/MINOR_REVISE/MAJOR_REVISE/REWRITE/BLOCKED
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext,
  AuditResult,
  AuditFeedback,
  DimensionScore,
  AuditIssue,
  RevisionSuggestion
} from '../types/index.js';

/** 审核维度配置 */
interface AuditDimensionConfig {
  id: string;
  name: string;
  weight: number;
  threshold: number;
  critical: boolean;
}

/** Auditor输出 */
interface AuditorOutput extends AuditFeedback {
  approvalReason: string;
  blockedReasons: string[];
}

export class AuditorAgent extends BaseAgent {
  readonly name = 'Auditor';
  readonly type = AgentType.AUDITOR;
  
  protected entryState = WorkflowState.DEEP_EDIT_DONE;
  protected successState = WorkflowState.AUDIT_DONE;
  
  /** 20维度审核配置 */
  private readonly auditDimensions: AuditDimensionConfig[] = [
    // 核心维度 (critical)
    { id: 'ad-01', name: '世界观一致性', weight: 0.08, threshold: 80, critical: true },
    { id: 'ad-02', name: '角色行为合理性', weight: 0.08, threshold: 75, critical: true },
    { id: 'ad-03', name: '剧情逻辑性', weight: 0.08, threshold: 75, critical: true },
    { id: 'ad-04', name: '价值观合规', weight: 0.10, threshold: 90, critical: true },
    
    // 质量维度
    { id: 'ad-05', name: '开篇吸引力', weight: 0.06, threshold: 70, critical: false },
    { id: 'ad-06', name: '爽点设计', weight: 0.06, threshold: 70, critical: false },
    { id: 'ad-07', name: '悬念设置', weight: 0.06, threshold: 70, critical: false },
    { id: 'ad-08', name: '节奏控制', weight: 0.05, threshold: 65, critical: false },
    { id: 'ad-09', name: '情感表达', weight: 0.05, threshold: 65, critical: false },
    { id: 'ad-10', name: '信息密度', weight: 0.04, threshold: 60, critical: false },
    
    // 文本维度
    { id: 'ad-11', name: '文字流畅度', weight: 0.04, threshold: 70, critical: false },
    { id: 'ad-12', name: '句式多样性', weight: 0.03, threshold: 65, critical: false },
    { id: 'ad-13', name: '用词准确性', weight: 0.03, threshold: 70, critical: false },
    { id: 'ad-14', name: 'AI痕迹检测', weight: 0.05, threshold: 75, critical: false },
    
    // 商业维度
    { id: 'ad-15', name: '追读吸引力', weight: 0.05, threshold: 70, critical: false },
    { id: 'ad-16', name: '付费转化潜力', weight: 0.04, threshold: 65, critical: false },
    
    // 结构维度
    { id: 'ad-17', name: '场景完整性', weight: 0.03, threshold: 70, critical: false },
    { id: 'ad-18', name: 'POV一致性', weight: 0.03, threshold: 75, critical: false },
    { id: 'ad-19', name: '伏笔处理', weight: 0.03, threshold: 65, critical: false },
    { id: 'ad-20', name: '字数达标', weight: 0.02, threshold: 80, critical: false }
  ];
  
  protected async run(context: AgentContext): Promise<AuditorOutput> {
    const content = context.content!;
    
    // 1. 执行各维度审核
    const dimensionScores = await this.auditAllDimensions(content, context);
    
    // 2. 计算加权总分
    const totalScore = this.calculateTotalScore(dimensionScores);
    
    // 3. 识别问题
    const issues = this.identifyIssues(dimensionScores);
    
    // 4. 生成修订建议
    const revisionSuggestions = this.generateRevisionSuggestions(issues, dimensionScores);
    
    // 5. 确定审核结果
    const result = this.determineAuditResult(totalScore, issues, dimensionScores);
    
    // 6. 生成审批原因
    const approvalReason = this.generateApprovalReason(result, totalScore, issues);
    
    // 7. 识别阻塞原因
    const blockedReasons = result === AuditResult.BLOCKED 
      ? this.identifyBlockedReasons(issues)
      : [];
    
    return {
      id: `audit-${this.generateId()}`,
      result,
      dimensionScores,
      totalScore,
      issues,
      revisionSuggestions,
      auditedAt: new Date(),
      approvalReason,
      blockedReasons
    };
  }
  
  /** 审核所有维度 */
  private async auditAllDimensions(
    content: string,
    context: AgentContext
  ): Promise<DimensionScore[]> {
    const scores: DimensionScore[] = [];
    
    for (const dim of this.auditDimensions) {
      const score = await this.auditDimension(dim, content, context);
      scores.push(score);
    }
    
    return scores;
  }
  
  /** 审核单个维度 */
  private async auditDimension(
    config: AuditDimensionConfig,
    content: string,
    context: AgentContext
  ): Promise<DimensionScore> {
    // TODO: 实现实际的维度审核逻辑
    // 这里返回模拟结果
    
    let score = 75;
    let comment = '';
    
    switch (config.id) {
      case 'ad-01':
        score = 88;
        comment = '世界观设定一致，无违规';
        break;
      case 'ad-02':
        score = 82;
        comment = '角色行为基本合理';
        break;
      case 'ad-03':
        score = 78;
        comment = '剧情逻辑通顺';
        break;
      case 'ad-04':
        score = 92;
        comment = '价值观符合规范';
        break;
      case 'ad-05':
        score = 80;
        comment = '开篇有一定吸引力';
        break;
      case 'ad-06':
        score = 85;
        comment = '爽点设计有效';
        break;
      case 'ad-07':
        score = 88;
        comment = '悬念设置良好';
        break;
      case 'ad-08':
        score = 68;
        comment = '节奏略显拖沓';
        break;
      case 'ad-09':
        score = 75;
        comment = '情感表达适中';
        break;
      case 'ad-10':
        score = 72;
        comment = '信息密度合理';
        break;
      case 'ad-11':
        score = 82;
        comment = '文字流畅';
        break;
      case 'ad-12':
        score = 70;
        comment = '句式有一定变化';
        break;
      case 'ad-13':
        score = 78;
        comment = '用词基本准确';
        break;
      case 'ad-14':
        score = 72;
        comment = '存在轻微AI痕迹';
        break;
      case 'ad-15':
        score = 80;
        comment = '有追读吸引力';
        break;
      case 'ad-16':
        score = 75;
        comment = '付费转化潜力中等';
        break;
      case 'ad-17':
        score = 85;
        comment = '场景完整';
        break;
      case 'ad-18':
        score = 88;
        comment = 'POV一致';
        break;
      case 'ad-19':
        score = 70;
        comment = '伏笔处理一般';
        break;
      case 'ad-20':
        score = 90;
        comment = '字数达标';
        break;
    }
    
    return {
      dimension: config.name,
      score,
      weight: config.weight,
      comment
    };
  }
  
  /** 计算加权总分 */
  private calculateTotalScore(dimensionScores: DimensionScore[]): number {
    let weightedSum = 0;
    let weightSum = 0;
    
    for (const ds of dimensionScores) {
      weightedSum += ds.score * ds.weight;
      weightSum += ds.weight;
    }
    
    return Math.round(weightedSum / weightSum);
  }
  
  /** 识别问题 */
  private identifyIssues(dimensionScores: DimensionScore[]): AuditIssue[] {
    const issues: AuditIssue[] = [];
    
    for (const ds of dimensionScores) {
      const config = this.auditDimensions.find(d => d.name === ds.dimension);
      if (!config) continue;
      
      if (ds.score < config.threshold) {
        issues.push({
          id: `issue-${this.generateId()}`,
          type: config.critical ? 'critical' : (ds.score < config.threshold - 10 ? 'major' : 'minor'),
          dimension: ds.dimension,
          description: `${ds.dimension}分数(${ds.score})低于阈值(${config.threshold})`,
          suggestion: this.getImprovementSuggestion(ds.dimension, ds.score)
        });
      }
    }
    
    return issues;
  }
  
  /** 获取改进建议 */
  private getImprovementSuggestion(dimension: string, score: number): string {
    const suggestions: Record<string, string> = {
      '世界观一致性': '检查并修正世界观设定相关的描述',
      '角色行为合理性': '调整角色行为以符合其性格设定',
      '剧情逻辑性': '梳理剧情逻辑，确保前后一致',
      '节奏控制': '调整节奏，增加紧张-放松的节奏变化',
      'AI痕迹检测': '进行AI去味处理，减少典型AI痕迹',
      '伏笔处理': '优化伏笔的埋设或回收方式'
    };
    
    return suggestions[dimension] || '改进该维度以提升整体质量';
  }
  
  /** 生成修订建议 */
  private generateRevisionSuggestions(
    issues: AuditIssue[],
    dimensionScores: DimensionScore[]
  ): RevisionSuggestion[] {
    const suggestions: RevisionSuggestion[] = [];
    
    // 按问题优先级生成建议
    const sortedIssues = [...issues].sort((a, b) => {
      const order = { critical: 0, major: 1, minor: 2 };
      return order[a.type] - order[b.type];
    });
    
    for (const issue of sortedIssues.slice(0, 5)) { // 最多5条建议
      suggestions.push({
        id: `suggestion-${this.generateId()}`,
        type: this.determineSuggestionType(issue),
        priority: issue.type === 'critical' ? 'high' : (issue.type === 'major' ? 'medium' : 'low'),
        description: issue.description,
        action: issue.suggestion
      });
    }
    
    return suggestions;
  }
  
  /** 确定建议类型 */
  private determineSuggestionType(issue: AuditIssue): 'add' | 'remove' | 'modify' | 'restructure' {
    if (issue.dimension.includes('伏笔') || issue.dimension.includes('信息')) {
      return 'add';
    }
    if (issue.dimension.includes('AI痕迹')) {
      return 'modify';
    }
    if (issue.dimension.includes('结构') || issue.dimension.includes('节奏')) {
      return 'restructure';
    }
    return 'modify';
  }
  
  /** 确定审核结果 */
  private determineAuditResult(
    totalScore: number,
    issues: AuditIssue[],
    dimensionScores: DimensionScore[]
  ): AuditResult {
    const criticalIssues = issues.filter(i => i.type === 'critical');
    const majorIssues = issues.filter(i => i.type === 'major');
    
    // 有严重违规，直接阻塞
    if (criticalIssues.length >= 2) {
      return AuditResult.BLOCKED;
    }
    
    // 核心维度有严重问题，需要重写
    const criticalDimensionScores = dimensionScores.filter(ds => {
      const config = this.auditDimensions.find(d => d.name === ds.dimension);
      return config?.critical && ds.score < 60;
    });
    
    if (criticalDimensionScores.length >= 1) {
      return AuditResult.REWRITE;
    }
    
    // 总分过低
    if (totalScore < 60) {
      return AuditResult.REWRITE;
    }
    
    // 有较多问题需要大修订
    if (majorIssues.length >= 3 || totalScore < 70) {
      return AuditResult.MAJOR_REVISE;
    }
    
    // 有一些问题需要小修订
    if (issues.length >= 2 || totalScore < 80) {
      return AuditResult.MINOR_REVISE;
    }
    
    // 通过
    return AuditResult.PASS;
  }
  
  /** 生成审批原因 */
  private generateApprovalReason(
    result: AuditResult,
    totalScore: number,
    issues: AuditIssue[]
  ): string {
    const reasons: Record<AuditResult, string> = {
      [AuditResult.PASS]: `审核通过，总分${totalScore}，各项指标达标`,
      [AuditResult.MINOR_REVISE]: `需要小修订，总分${totalScore}，发现${issues.filter(i => i.type === 'minor').length}个轻微问题`,
      [AuditResult.MAJOR_REVISE]: `需要大修订，总分${totalScore}，发现${issues.length}个问题需要处理`,
      [AuditResult.REWRITE]: `建议重写，总分${totalScore}，核心维度未达标`,
      [AuditResult.BLOCKED]: `已阻塞，发现严重违规问题`
    };
    
    return reasons[result];
  }
  
  /** 识别阻塞原因 */
  private identifyBlockedReasons(issues: AuditIssue[]): string[] {
    return issues
      .filter(i => i.type === 'critical')
      .map(i => `[${i.dimension}] ${i.description}`);
  }
}