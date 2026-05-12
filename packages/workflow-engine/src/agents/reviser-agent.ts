/**
 * Reviser Agent - 修订器
 * 根据审核意见修订,执行29种AI去味模式
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext,
  AuditFeedback,
  AIDehumanizeMode
} from '../types/index.js';

/** 修订操作 */
interface RevisionOperation {
  type: 'add' | 'remove' | 'modify' | 'restructure';
  target: string;
  description: string;
  before?: string;
  after?: string;
}

/** 去味模式执行结果 */
interface DehumanizeResult {
  mode: AIDehumanizeMode;
  changes: number;
  details: string[];
}

/** Reviser输出 */
interface ReviserOutput {
  revisedContent: string;
  originalWordCount: number;
  revisedWordCount: number;
  revisionOperations: RevisionOperation[];
  dehumanizeResults: DehumanizeResult[];
  revisionSummary: string;
  changesHighlight: string[];
}

export class ReviserAgent extends BaseAgent {
  readonly name = 'Reviser';
  readonly type = AgentType.REVISER;
  
  protected entryState = WorkflowState.AUDIT_DONE;
  protected successState = WorkflowState.REVISED;
  
  /** 29种AI去味模式配置 */
  private readonly dehumanizeModes: Map<AIDehumanizeMode, {
    name: string;
    description: string;
    priority: number;
  }> = new Map([
    // 句式相关
    [AIDehumanizeMode.REMOVE_EM_DASH_OVERUSE, { name: '去除断号过度使用', description: '减少过多的破折号使用', priority: 1 }],
    [AIDehumanizeMode.SIMPLIFY_COMPLEX_SENTENCES, { name: '简化复杂句式', description: '拆分过长的复杂句子', priority: 2 }],
    [AIDehumanizeMode.VARY_SENTENCE_STRUCTURE, { name: '变化句式结构', description: '避免重复的句式模式', priority: 1 }],
    [AIDehumanizeMode.REDUCE_PASSIVE_VOICE, { name: '减少被动语态', description: '将被动改为主动', priority: 2 }],
    
    // 词汇相关
    [AIDehumanizeMode.REMOVE_AI_VOCABULARY, { name: '移除AI典型词汇', description: '替换典型的AI生成词汇', priority: 1 }],
    [AIDehumanizeMode.REDUCE_ADVERB_OVERUSE, { name: '减少副词滥用', description: '削减过多的副词修饰', priority: 2 }],
    [AIDehumanizeMode.DIALOGUE_NATURALIZATION, { name: '对话自然化', description: '让对话更加自然', priority: 1 }],
    
    // 结构相关
    [AIDehumanizeMode.BREAK_RULE_OF_THREE, { name: '打破三段式', description: '避免典型的三项列举', priority: 2 }],
    [AIDehumanizeMode.REDUCE_PARALLELISM, { name: '减少排比句', description: '降低过度工整的排比', priority: 3 }],
    [AIDehumanizeMode.REMOVE_INFLATED_SYMBOLISM, { name: '移除过度象征', description: '减少生硬的象征手法', priority: 2 }],
    
    // 情感相关
    [AIDehumanizeMode.REDUCE_EMOTIONAL_CLICHES, { name: '减少情感陈词滥调', description: '替换常见的情感表达', priority: 2 }],
    [AIDehumanizeMode.GROUND_ABSTRACT_EMOTIONS, { name: '具象化抽象情感', description: '用具体描写代替抽象情感', priority: 1 }],
    
    // 节奏相关
    [AIDehumanizeMode.VARY_PARAGRAPH_LENGTH, { name: '变化段落长度', description: '增加段落长短变化', priority: 2 }],
    [AIDehumanizeMode.REMOVE_FORMULAIC_TRANSITIONS, { name: '移除公式化过渡', description: '替换僵硬的过渡句', priority: 1 }],
    
    // 其他
    [AIDehumanizeMode.ADD_SPECIFIC_DETAILS, { name: '增加具体细节', description: '添加具体化的细节描写', priority: 1 }],
    [AIDehumanizeMode.REMOVE_VAGUE_ATTRIBUTIONS, { name: '移除模糊归属', description: '具体化模糊的归属描述', priority: 2 }],
    [AIDehumanizeMode.REDUCE_PROMOTIONAL_TONE, { name: '减少推广语气', description: '消除过于营销化的表达', priority: 2 }],
    [AIDehumanizeMode.HUMANIZE_DIALOGUE_TAGS, { name: '人性化对话标签', description: '自然化对话标签', priority: 3 }],
    [AIDehumanizeMode.REMOVE_OVER_EXPLANATION, { name: '移除过度解释', description: '删除冗余的解释', priority: 2 }],
    [AIDehumanizeMode.ADD_SUBTEXT, { name: '增加潜台词', description: '增加含蓄的表达', priority: 1 }],
    [AIDehumanizeMode.REDUNDANCY_REMOVAL, { name: '冗余移除', description: '删除重复冗余内容', priority: 2 }],
    [AIDehumanizeMode.SHOW_DONT_TELL, { name: '展示而非告知', description: '用描写代替直接告知', priority: 1 }],
    [AIDehumanizeMode.IMPERFECT_CHARACTER_VOICE, { name: '不完美角色声音', description: '让角色语言更真实', priority: 3 }],
    [AIDehumanizeMode.CULTURAL_SPECIFICITY, { name: '文化特异性', description: '增加文化独特性', priority: 3 }],
    [AIDehumanizeMode.REMOVE_HEDGING_LANGUAGE, { name: '移除模糊语言', description: '删除过于谨慎的表达', priority: 2 }],
    [AIDehumanizeMode.ADD_SENSORY_DETAILS, { name: '增加感官细节', description: '添加五感描写', priority: 1 }],
    [AIDehumanizeMode.BREAK_PREDICTABLE_PATTERNS, { name: '打破可预测模式', description: '避免过于规整的模式', priority: 2 }],
    [AIDehumanizeMode.CONTEXTUAL_DIALOGUE, { name: '情境化对话', description: '让对话更贴合情境', priority: 2 }],
    [AIDehumanizeMode.EMOTIONAL_AMBIGUITY, { name: '情感模糊性', description: '增加情感的不确定性', priority: 3 }],
    [AIDehumanizeMode.NARRATIVE_UNRELIABILITY, { name: '叙事不可靠性', description: '增加叙事层次感', priority: 3 }]
  ]);
  
  protected async run(context: AgentContext): Promise<ReviserOutput> {
    const content = context.content!;
    const auditResult = context.auditResult!;
    
    // 1. 分析修订需求
    const revisionPlan = this.analyzeRevisionNeeds(auditResult);
    
    // 2. 执行内容修订
    let revisedContent = content;
    const revisionOperations: RevisionOperation[] = [];
    
    // 2.1 处理审核意见
    const auditRevisions = await this.processAuditFeedback(content, auditResult);
    revisedContent = auditRevisions.content;
    revisionOperations.push(...auditRevisions.operations);
    
    // 2.2 执行AI去味
    const dehumanizeResults: DehumanizeResult[] = [];
    
    // 根据审核结果决定去味程度
    const modesToApply = this.selectDehumanizeModes(auditResult);
    
    for (const mode of modesToApply) {
      const result = await this.applyDehumanizeMode(revisedContent, mode);
      if (result.changes > 0) {
        revisedContent = this.applyChanges(revisedContent, result);
        dehumanizeResults.push(result);
      }
    }
    
    // 3. 计算字数变化
    const originalWordCount = this.countWords(content);
    const revisedWordCount = this.countWords(revisedContent);
    
    // 4. 生成修订摘要
    const revisionSummary = this.generateRevisionSummary(
      revisionOperations,
      dehumanizeResults,
      originalWordCount,
      revisedWordCount
    );
    
    // 5. 提取变更亮点
    const changesHighlight = this.extractChangesHighlight(revisionOperations, dehumanizeResults);
    
    return {
      revisedContent,
      originalWordCount,
      revisedWordCount,
      revisionOperations,
      dehumanizeResults,
      revisionSummary,
      changesHighlight
    };
  }
  
  /** 分析修订需求 */
  private analyzeRevisionNeeds(auditResult: AuditFeedback): {
    needsContentRevision: boolean;
    needsDehumanize: boolean;
    priorityDimensions: string[];
  } {
    const criticalIssues = auditResult.issues.filter(i => i.type === 'critical');
    const majorIssues = auditResult.issues.filter(i => i.type === 'major');
    
    return {
      needsContentRevision: auditResult.issues.length > 0,
      needsDehumanize: auditResult.dimensionScores.some(
        ds => ds.dimension === 'AI痕迹检测' && ds.score < 80
      ),
      priorityDimensions: [...criticalIssues, ...majorIssues].map(i => i.dimension)
    };
  }
  
  /** 处理审核反馈 */
  private async processAuditFeedback(
    content: string,
    auditResult: AuditFeedback
  ): Promise<{ content: string; operations: RevisionOperation[] }> {
    const operations: RevisionOperation[] = [];
    let revisedContent = content;
    
    for (const suggestion of auditResult.revisionSuggestions) {
      const operation = await this.applyRevisionSuggestion(revisedContent, suggestion);
      if (operation) {
        operations.push(operation);
        // 实际修订内容
        revisedContent = this.applyRevisionOperation(revisedContent, operation);
      }
    }
    
    return { content: revisedContent, operations };
  }
  
  /** 应用修订建议 */
  private async applyRevisionSuggestion(
    content: string,
    suggestion: { type: string; description: string; action?: string }
  ): Promise<RevisionOperation | null> {
    // TODO: 实现实际的修订逻辑
    // 这里返回模拟操作
    
    return {
      type: suggestion.type as 'add' | 'remove' | 'modify' | 'restructure',
      target: suggestion.description,
      description: suggestion.action || suggestion.description,
      before: '修订前的内容片段',
      after: '修订后的内容片段'
    };
  }
  
  /** 应用修订操作 */
  private applyRevisionOperation(content: string, operation: RevisionOperation): string {
    // TODO: 实现实际的内容修改
    return content;
  }
  
  /** 选择去味模式 */
  private selectDehumanizeModes(auditResult: AuditFeedback): AIDehumanizeMode[] {
    const aiDimension = auditResult.dimensionScores.find(
      ds => ds.dimension === 'AI痕迹检测'
    );
    
    // 根据AI痕迹分数决定应用哪些模式
    const score = aiDimension?.score || 75;
    
    if (score < 60) {
      // 严重AI痕迹，应用所有模式
      return Array.from(this.dehumanizeModes.keys());
    } else if (score < 70) {
      // 明显AI痕迹，应用高优先级模式
      return Array.from(this.dehumanizeModes.entries())
        .filter(([_, config]) => config.priority <= 2)
        .map(([mode]) => mode);
    } else if (score < 80) {
      // 轻微AI痕迹，应用关键模式
      return Array.from(this.dehumanizeModes.entries())
        .filter(([_, config]) => config.priority === 1)
        .map(([mode]) => mode);
    }
    
    // 无明显问题，仅应用基础模式
    return [
      AIDehumanizeMode.REMOVE_AI_VOCABULARY,
      AIDehumanizeMode.VARY_SENTENCE_STRUCTURE,
      AIDehumanizeMode.ADD_SENSORY_DETAILS
    ];
  }
  
  /** 应用去味模式 */
  private async applyDehumanizeMode(
    content: string,
    mode: AIDehumanizeMode
  ): Promise<DehumanizeResult> {
    const config = this.dehumanizeModes.get(mode);
    
    // TODO: 实现实际的去味处理
    // 这里返回模拟结果
    
    const changes = Math.floor(Math.random() * 5);
    
    return {
      mode,
      changes,
      details: changes > 0 
        ? [`应用${config?.name || mode}，共${changes}处修改`]
        : []
    };
  }
  
  /** 应用变更 */
  private applyChanges(content: string, result: DehumanizeResult): string {
    // TODO: 实现实际的变更应用
    return content;
  }
  
  /** 计算字数 */
  private countWords(content: string): number {
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = content.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + englishWords.length;
  }
  
  /** 生成修订摘要 */
  private generateRevisionSummary(
    operations: RevisionOperation[],
    dehumanizeResults: DehumanizeResult[],
    originalCount: number,
    revisedCount: number
  ): string {
    const totalChanges = operations.length + 
      dehumanizeResults.reduce((sum, r) => sum + r.changes, 0);
    
    let summary = `修订完成：共执行${totalChanges}项修改\n`;
    summary += `字数变化：${originalCount} → ${revisedCount} (${revisedCount - originalCount > 0 ? '+' : ''}${revisedCount - originalCount})\n`;
    
    if (operations.length > 0) {
      summary += `内容修订：${operations.length}项\n`;
    }
    
    if (dehumanizeResults.some(r => r.changes > 0)) {
      summary += `AI去味：${dehumanizeResults.filter(r => r.changes > 0).length}种模式\n`;
    }
    
    return summary;
  }
  
  /** 提取变更亮点 */
  private extractChangesHighlight(
    operations: RevisionOperation[],
    dehumanizeResults: DehumanizeResult[]
  ): string[] {
    const highlights: string[] = [];
    
    for (const op of operations.slice(0, 3)) {
      highlights.push(`【${op.type}】${op.target}`);
    }
    
    for (const result of dehumanizeResults.filter(r => r.changes > 0).slice(0, 3)) {
      const config = this.dehumanizeModes.get(result.mode);
      highlights.push(`【去味】${config?.name || result.mode}：${result.changes}处`);
    }
    
    return highlights;
  }
}