/**
 * Planner Agent - 规划器
 * 读取知识库、项目设定、上下文,生成创作约束清单(15项)
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext,
  CreationConstraint,
  ConstraintChecklist,
  ConstraintCategory
} from '../types/index.js';

export class PlannerAgent extends BaseAgent {
  readonly name = 'Planner';
  readonly type = AgentType.PLANNER;
  
  protected entryState = WorkflowState.PENDING;
  protected successState = WorkflowState.PLANNED;
  
  /** 15项核心约束模板 */
  private readonly coreConstraints: Array<{
    category: ConstraintCategory;
    name: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }> = [
    { category: ConstraintCategory.WORLD_BUILDING, name: '世界观一致性', description: '确保世界观设定的一致性', priority: 'critical' },
    { category: ConstraintCategory.CHARACTER, name: '角色行为一致性', description: '角色行为符合设定和性格', priority: 'critical' },
    { category: ConstraintCategory.PLOT, name: '剧情主线推进', description: '确保剧情主线在本章有实质推进', priority: 'critical' },
    { category: ConstraintCategory.STYLE, name: '风格一致性', description: '保持与前文风格一致', priority: 'high' },
    { category: ConstraintCategory.CHAPTER_GOAL, name: '章节目标', description: '本章需达成的核心目标', priority: 'critical' },
    { category: ConstraintCategory.FORESHADOWING, name: '伏笔追踪', description: '本章需处理的伏笔', priority: 'high' },
    { category: ConstraintCategory.PACING, name: '节奏控制', description: '章节节奏配置', priority: 'high' },
    { category: ConstraintCategory.EMOTION, name: '情感曲线', description: '章节情感走向设计', priority: 'high' },
    { category: ConstraintCategory.INFORMATION, name: '信息密度', description: '新信息披露量控制', priority: 'medium' },
    { category: ConstraintCategory.POV, name: 'POV视角', description: '叙事视角选择', priority: 'high' },
    { category: ConstraintCategory.DURATION, name: '时长预估', description: '阅读时长估算', priority: 'low' },
    { category: ConstraintCategory.WORD_COUNT, name: '字数要求', description: '章节字数范围', priority: 'medium' },
    { category: ConstraintCategory.HOOK, name: 'Hook设置', description: '章节开头吸引力设计', priority: 'critical' },
    { category: ConstraintCategory.COOL_MOMENT, name: '爽点设计', description: '本章爽点分布', priority: 'high' },
    { category: ConstraintCategory.PLOT, name: '悬念设置', description: '章节结尾悬念设计', priority: 'critical' }
  ];
  
  protected async run(context: AgentContext): Promise<ConstraintChecklist> {
    // 1. 从知识库读取相关设定
    const knowledgeBase = await this.fetchKnowledgeBase(context);
    
    // 2. 从项目读取配置
    const projectSettings = await this.fetchProjectSettings(context);
    
    // 3. 分析上下文
    const contextAnalysis = await this.analyzeContext(context);
    
    // 4. 生成约束清单
    const constraints = await this.generateConstraints(
      knowledgeBase,
      projectSettings,
      contextAnalysis,
      context
    );
    
    // 5. 创建约束清单对象
    const checklist: ConstraintChecklist = {
      id: this.generateId(),
      chapterId: context.chapterId,
      createdAt: new Date(),
      constraints: constraints,
      validationStatus: {}
    };
    
    // 6. 验证约束完整性
    checklist.validationStatus = this.validateConstraints(checklist);
    
    return checklist;
  }
  
  /** 获取知识库数据 */
  private async fetchKnowledgeBase(context: AgentContext): Promise<Record<string, unknown>> {
    // TODO: 实现实际的数据库查询
    // 这里返回模拟数据
    return {
      worldBuilding: {},
      characters: {},
      plotThreads: [],
      foreshadowing: [],
      previousContent: {}
    };
  }
  
  /** 获取项目设置 */
  private async fetchProjectSettings(context: AgentContext): Promise<Record<string, unknown>> {
    // TODO: 实现实际的数据库查询
    return {
      styleProfile: context.styleProfile,
      targetAudience: 'general',
      genre: 'fantasy'
    };
  }
  
  /** 分析上下文 */
  private async analyzeContext(context: AgentContext): Promise<Record<string, unknown>> {
    // TODO: 实现上下文分析
    return {
      chapterOutline: context.chapterOutline,
      previousChapters: [],
      readerFeedback: []
    };
  }
  
  /** 生成约束清单 */
  private async generateConstraints(
    knowledgeBase: Record<string, unknown>,
    projectSettings: Record<string, unknown>,
    contextAnalysis: Record<string, unknown>,
    context: AgentContext
  ): Promise<CreationConstraint[]> {
    const constraints: CreationConstraint[] = [];
    
    for (const template of this.coreConstraints) {
      const constraint: CreationConstraint = {
        id: `constraint-${this.generateId()}`,
        category: template.category,
        name: template.name,
        description: template.description,
        value: await this.determineConstraintValue(
          template,
          knowledgeBase,
          projectSettings,
          contextAnalysis,
          context
        ),
        priority: template.priority,
        source: this.determineSource(template.category)
      };
      
      constraints.push(constraint);
    }
    
    return constraints;
  }
  
  /** 确定约束值 */
  private async determineConstraintValue(
    template: { category: ConstraintCategory; name: string },
    knowledgeBase: Record<string, unknown>,
    projectSettings: Record<string, unknown>,
    contextAnalysis: Record<string, unknown>,
    context: AgentContext
  ): Promise<string | number | boolean | string[]> {
    // 根据类别确定值
    switch (template.category) {
      case ConstraintCategory.WORLD_BUILDING:
        return '保持世界观设定一致性，避免违反已建立的规则';
      
      case ConstraintCategory.CHARACTER:
        if (context.chapterOutline?.mainCharacters) {
          return context.chapterOutline.mainCharacters;
        }
        return ['主角'];
      
      case ConstraintCategory.PLOT:
        if (context.chapterOutline?.summary) {
          return context.chapterOutline.summary;
        }
        return '推进主线剧情';
      
      case ConstraintCategory.STYLE:
        return context.styleProfile?.name || '默认风格';
      
      case ConstraintCategory.CHAPTER_GOAL:
        if (context.chapterOutline?.keyEvents) {
          return context.chapterOutline.keyEvents.join('; ');
        }
        return '达成章节目标';
      
      case ConstraintCategory.FORESHADOWING:
        return ['待处理的伏笔列表'];
      
      case ConstraintCategory.PACING:
        return 'medium';
      
      case ConstraintCategory.EMOTION:
        return context.chapterOutline?.emotionalTone || 'tension';
      
      case ConstraintCategory.INFORMATION:
        return '适度披露新信息';
      
      case ConstraintCategory.POV:
        return context.chapterOutline?.scenes?.[0]?.povCharacter || '第三人称';
      
      case ConstraintCategory.DURATION:
        return 15; // 预估阅读时长(分钟)
      
      case ConstraintCategory.WORD_COUNT:
        return { min: 2000, max: 5000 };
      
      case ConstraintCategory.HOOK:
        return context.chapterOutline?.hook || '设计吸引读者的开头';
      
      case ConstraintCategory.COOL_MOMENT:
        return ['爽点1', '爽点2'];
      
      default:
        return '待定义';
    }
  }
  
  /** 确定约束来源 */
  private determineSource(category: ConstraintCategory): 'knowledge_base' | 'project_setting' | 'context' | 'user_input' {
    if ([ConstraintCategory.WORLD_BUILDING, ConstraintCategory.CHARACTER, ConstraintCategory.FORESHADOWING].includes(category)) {
      return 'knowledge_base';
    }
    if ([ConstraintCategory.STYLE, ConstraintCategory.POV, ConstraintCategory.WORD_COUNT].includes(category)) {
      return 'project_setting';
    }
    if ([ConstraintCategory.PLOT, ConstraintCategory.CHAPTER_GOAL, ConstraintCategory.HOOK].includes(category)) {
      return 'context';
    }
    return 'project_setting';
  }
  
  /** 验证约束完整性 */
  private validateConstraints(checklist: ConstraintChecklist): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const constraint of checklist.constraints) {
      // 检查约束是否有值
      const isValid = constraint.value !== undefined && 
                      constraint.value !== null &&
                      constraint.value !== '';
      
      status[constraint.id] = isValid;
    }
    
    return status;
  }
}