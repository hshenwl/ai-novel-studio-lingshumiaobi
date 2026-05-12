/**
 * Settler Agent - 沉淀器
 * 将定稿内容同步入库,更新角色、伏笔、Hook等
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext,
  ConstraintChecklist
} from '../types/index.js';

/** 沉淀数据项 */
interface SettledDataItem {
  type: 'character' | 'foreshadowing' | 'hook' | 'plot_thread' | 'world_setting' | 'emotion_arc';
  action: 'create' | 'update' | 'resolve';
  data: Record<string, unknown>;
  sourceChapter: string;
}

/** 沉淀统计 */
interface SettlementStats {
  charactersUpdated: number;
  foreshadowingCreated: number;
  foreshadowingResolved: number;
  hooksSet: number;
  plotThreadsAdvanced: number;
  worldSettingsUpdated: number;
  emotionArcsRecorded: number;
}

/** Settler输出 */
interface SettlerOutput {
  settledItems: SettledDataItem[];
  stats: SettlementStats;
  knowledgeBaseUpdates: string[];
  summary: string;
}

export class SettlerAgent extends BaseAgent {
  readonly name = 'Settler';
  readonly type = AgentType.SETTLER;
  
  protected entryState = WorkflowState.AUDIT_DONE;
  protected successState = WorkflowState.COMPLETED;
  
  protected async run(context: AgentContext): Promise<SettlerOutput> {
    const content = context.content!;
    const constraints = context.constraints!;
    const chapterId = context.chapterId;
    
    // 1. 提取章节中的关键元素
    const extractedElements = await this.extractElements(content, context);
    
    // 2. 对比知识库，识别变更
    const changes = await this.identifyChanges(extractedElements, context);
    
    // 3. 生成沉淀数据
    const settledItems = this.generateSettlementData(changes, chapterId);
    
    // 4. 同步到数据库
    await this.syncToDatabase(settledItems, context);
    
    // 5. 计算统计
    const stats = this.calculateStats(settledItems);
    
    // 6. 生成知识库更新日志
    const knowledgeBaseUpdates = this.generateUpdateLog(settledItems);
    
    // 7. 生成摘要
    const summary = this.generateSummary(stats, settledItems);
    
    return {
      settledItems,
      stats,
      knowledgeBaseUpdates,
      summary
    };
  }
  
  /** 提取章节中的关键元素 */
  private async extractElements(
    content: string,
    context: AgentContext
  ): Promise<{
    characters: Map<string, CharacterState>;
    foreshadowing: ForeshadowingInfo[];
    hooks: HookInfo[];
    plotThreads: PlotThreadInfo[];
    worldSettings: WorldSettingInfo[];
    emotionArcs: EmotionArcInfo[];
  }> {
    // TODO: 实现实际的元素提取逻辑
    // 这里使用AI或规则引擎提取
    
    return {
      characters: new Map([
        ['主角', { 
          name: '主角',
          stateChanges: ['获得了新能力'],
          relationships: [{ target: '配角A', type: 'ally', change: 'strengthened' }]
        }]
      ]),
      foreshadowing: [
        { id: 'fs-1', content: '神秘人物的出现', type: 'planted', resolved: false },
        { id: 'fs-2', content: '主角的隐藏身份暗示', type: 'hinted', resolved: false }
      ],
      hooks: [
        { position: 'opening', type: 'suspense', content: '暴风雨前的宁静' },
        { position: 'ending', type: 'cliffhanger', content: '神秘人物的身份' }
      ],
      plotThreads: [
        { id: 'pt-1', name: '主线', progress: 0.1, events: ['发现新线索'] }
      ],
      worldSettings: [
        { category: 'magic_system', updates: ['新魔法规则披露'] }
      ],
      emotionArcs: [
        { character: '主角', start: '平静', peak: '紧张', end: '决心' }
      ]
    };
  }
  
  /** 识别变更 */
  private async identifyChanges(
    elements: Awaited<ReturnType<typeof this.extractElements>>,
    context: AgentContext
  ): Promise<{
    newCharacters: string[];
    updatedCharacters: string[];
    newForeshadowing: ForeshadowingInfo[];
    resolvedForeshadowing: string[];
    newHooks: HookInfo[];
    plotAdvancements: PlotThreadInfo[];
    worldUpdates: WorldSettingInfo[];
  }> {
    // TODO: 对比现有知识库识别变更
    
    return {
      newCharacters: [],
      updatedCharacters: Array.from(elements.characters.keys()),
      newForeshadowing: elements.foreshadowing.filter(f => f.type === 'planted'),
      resolvedForeshadowing: elements.foreshadowing.filter(f => f.resolved).map(f => f.id),
      newHooks: elements.hooks,
      plotAdvancements: elements.plotThreads,
      worldUpdates: elements.worldSettings
    };
  }
  
  /** 生成沉淀数据 */
  private generateSettlementData(
    changes: Awaited<ReturnType<typeof this.identifyChanges>>,
    chapterId: string
  ): SettledDataItem[] {
    const items: SettledDataItem[] = [];
    
    // 角色更新
    for (const charName of changes.updatedCharacters) {
      items.push({
        type: 'character',
        action: 'update',
        data: { name: charName, lastAppearance: chapterId },
        sourceChapter: chapterId
      });
    }
    
    // 新伏笔
    for (const fs of changes.newForeshadowing) {
      items.push({
        type: 'foreshadowing',
        action: 'create',
        data: fs,
        sourceChapter: chapterId
      });
    }
    
    // 解决伏笔
    for (const fsId of changes.resolvedForeshadowing) {
      items.push({
        type: 'foreshadowing',
        action: 'resolve',
        data: { id: fsId, resolvedAt: chapterId },
        sourceChapter: chapterId
      });
    }
    
    // Hook设置
    for (const hook of changes.newHooks) {
      items.push({
        type: 'hook',
        action: 'create',
        data: hook,
        sourceChapter: chapterId
      });
    }
    
    // 剧情线推进
    for (const pt of changes.plotAdvancements) {
      items.push({
        type: 'plot_thread',
        action: 'update',
        data: pt,
        sourceChapter: chapterId
      });
    }
    
    // 世界观更新
    for (const ws of changes.worldUpdates) {
      items.push({
        type: 'world_setting',
        action: 'update',
        data: ws,
        sourceChapter: chapterId
      });
    }
    
    return items;
  }
  
  /** 同步到数据库 */
  private async syncToDatabase(
    items: SettledDataItem[],
    context: AgentContext
  ): Promise<void> {
    // TODO: 实现实际的数据库同步
    // const db = this.dbClient;
    // for (const item of items) {
    //   await db.upsert(item.type, item.data);
    // }
  }
  
  /** 计算统计 */
  private calculateStats(items: SettledDataItem[]): SettlementStats {
    return {
      charactersUpdated: items.filter(i => i.type === 'character').length,
      foreshadowingCreated: items.filter(i => i.type === 'foreshadowing' && i.action === 'create').length,
      foreshadowingResolved: items.filter(i => i.type === 'foreshadowing' && i.action === 'resolve').length,
      hooksSet: items.filter(i => i.type === 'hook').length,
      plotThreadsAdvanced: items.filter(i => i.type === 'plot_thread').length,
      worldSettingsUpdated: items.filter(i => i.type === 'world_setting').length,
      emotionArcsRecorded: items.filter(i => i.type === 'emotion_arc').length
    };
  }
  
  /** 生成知识库更新日志 */
  private generateUpdateLog(items: SettledDataItem[]): string[] {
    const logs: string[] = [];
    
    for (const item of items) {
      const actionName = {
        create: '新增',
        update: '更新',
        resolve: '解决'
      }[item.action];
      
      const typeName = {
        character: '角色',
        foreshadowing: '伏笔',
        hook: 'Hook',
        plot_thread: '剧情线',
        world_setting: '世界观',
        emotion_arc: '情感弧线'
      }[item.type];
      
      logs.push(`[${actionName}] ${typeName}: ${JSON.stringify(item.data).substring(0, 50)}...`);
    }
    
    return logs;
  }
  
  /** 生成摘要 */
  private generateSummary(stats: SettlementStats, items: SettledDataItem[]): string {
    let summary = '章节沉淀完成\n\n';
    summary += '本次更新统计：\n';
    
    if (stats.charactersUpdated > 0) {
      summary += `- 角色更新: ${stats.charactersUpdated}个\n`;
    }
    if (stats.foreshadowingCreated > 0) {
      summary += `- 新增伏笔: ${stats.foreshadowingCreated}个\n`;
    }
    if (stats.foreshadowingResolved > 0) {
      summary += `- 回收伏笔: ${stats.foreshadowingResolved}个\n`;
    }
    if (stats.hooksSet > 0) {
      summary += `- Hook设置: ${stats.hooksSet}个\n`;
    }
    if (stats.plotThreadsAdvanced > 0) {
      summary += `- 剧情推进: ${stats.plotThreadsAdvanced}条\n`;
    }
    if (stats.worldSettingsUpdated > 0) {
      summary += `- 世界观更新: ${stats.worldSettingsUpdated}处\n`;
    }
    
    summary += `\n总计: ${items.length}项数据已同步至知识库`;
    
    return summary;
  }
}

/** 辅助类型 */
interface CharacterState {
  name: string;
  stateChanges: string[];
  relationships: Array<{ target: string; type: string; change: string }>;
}

interface ForeshadowingInfo {
  id: string;
  content: string;
  type: 'planted' | 'hinted' | 'resolved';
  resolved: boolean;
}

interface HookInfo {
  position: 'opening' | 'middle' | 'ending';
  type: 'suspense' | 'cliffhanger' | 'question';
  content: string;
}

interface PlotThreadInfo {
  id: string;
  name: string;
  progress: number;
  events: string[];
}

interface WorldSettingInfo {
  category: string;
  updates: string[];
}

interface EmotionArcInfo {
  character: string;
  start: string;
  peak: string;
  end: string;
}