/**
 * Writer Agent - 写作器
 * 根据约束清单、章纲、风格生成正文,执行14项自检
 */

import { BaseAgent } from '../core/base-agent.js';
import {
  AgentType,
  WorkflowState,
  AgentContext,
  ConstraintChecklist,
  StyleProfile
} from '../types/index.js';

/** Writer自检项 */
interface WriterSelfCheck {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  score: number;
  comment?: string;
}

/** Writer输出 */
interface WriterOutput {
  content: string;
  wordCount: number;
  selfChecks: WriterSelfCheck[];
  metadata: Record<string, unknown>;
}

export class WriterAgent extends BaseAgent {
  readonly name = 'Writer';
  readonly type = AgentType.WRITER;
  
  protected entryState = WorkflowState.PLANNED;
  protected successState = WorkflowState.WRITTEN;
  
  /** 14项自检清单 */
  private readonly selfCheckItems: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
  }> = [
    { id: 'wc-01', name: '字数达标', description: '字数在要求范围内', weight: 0.1 },
    { id: 'wc-02', name: 'Hook有效性', description: '开头3段能否吸引读者', weight: 0.15 },
    { id: 'wc-03', name: '角色一致性', description: '角色言行符合设定', weight: 0.12 },
    { id: 'wc-04', name: '世界观一致性', description: '未违反世界观规则', weight: 0.12 },
    { id: 'wc-05', name: '剧情推进', description: '章节有实质剧情推进', weight: 0.15 },
    { id: 'wc-06', name: '伏笔处理', description: '伏笔正确埋设或回收', weight: 0.08 },
    { id: 'wc-07', name: '情感曲线', description: '情感走向符合设计', weight: 0.1 },
    { id: 'wc-08', name: '节奏控制', description: '节奏配置合理', weight: 0.1 },
    { id: 'wc-09', name: '信息密度', description: '信息披露量适度', weight: 0.06 },
    { id: 'wc-10', name: 'POV一致性', description: '视角切换合理', weight: 0.08 },
    { id: 'wc-11', name: '爽点设计', description: '爽点设置到位', weight: 0.12 },
    { id: 'wc-12', name: '悬念设置', description: '结尾悬念有效', weight: 0.15 },
    { id: 'wc-13', name: '风格一致性', description: '风格与前文一致', weight: 0.08 },
    { id: 'wc-14', name: '无明显AI痕迹', description: '无明显AI生成痕迹', weight: 0.1 }
  ];
  
  protected async run(context: AgentContext): Promise<WriterOutput> {
    // 1. 获取约束清单
    const constraints = context.constraints!;
    
    // 2. 获取章节大纲
    const outline = context.chapterOutline!;
    
    // 3. 获取风格配置
    const style = context.styleProfile!;
    
    // 4. 构建写作提示
    const prompt = this.buildWritingPrompt(constraints, outline, style);
    
    // 5. 生成正文
    const content = await this.generateContent(prompt, context);
    
    // 6. 执行14项自检
    const selfChecks = await this.executeSelfChecks(content, constraints, outline);
    
    // 7. 计算字数
    const wordCount = this.countWords(content);
    
    // 8. 构建输出
    return {
      content,
      wordCount,
      selfChecks,
      metadata: {
        generatedAt: new Date(),
        promptVersion: '1.0',
        modelUsed: 'default'
      }
    };
  }
  
  /** 构建写作提示 */
  private buildWritingPrompt(
    constraints: ConstraintChecklist,
    outline: unknown,
    style: StyleProfile
  ): string {
    const constraintList = constraints.constraints
      .map(c => `- ${c.name}: ${typeof c.value === 'object' ? JSON.stringify(c.value) : c.value}`)
      .join('\n');
    
    return `
你是一位专业的网络小说作家，需要根据以下约束和章纲创作章节正文。

## 创作约束清单
${constraintList}

## 风格要求
- 叙事视角: ${style.narrativeVoice}
- 时态: ${style.tense}
- 语言风格: ${style.languageStyle}
- 节奏偏好: ${style.pacingPreference}
- 对话比例: ${style.dialogueRatio * 100}%
- 描写密度: ${style.descriptionDensity}
- 情感强度: ${style.emotionalIntensity}

## 章纲
${JSON.stringify(outline, null, 2)}

## 写作要求
1. 严格遵守上述约束
2. 保持与前文风格一致
3. 确保剧情有实质推进
4. 设计有效的开头Hook
5. 设置吸引人的结尾悬念
6. 避免AI生成的典型痕迹（如过度使用冒号、僵硬的句式等）

请开始创作章节正文:
`;
  }
  
  /** 生成正文内容 */
  private async generateContent(prompt: string, context: AgentContext): Promise<string> {
    // TODO: 实现实际的AI调用
    // 这里返回模拟内容
    return `
[这里是生成的章节正文内容]

第一章 暴风雨前的宁静

天空阴沉沉的，像是要下雨了。

李明站在窗前，望着远处的山脉。他知道，暴风雨就要来了——不仅仅是天气，还有那场即将改变一切的战斗。

"准备好了吗？"身后传来熟悉的声音。

他转过身，看着自己的伙伴们。他们眼中闪烁着坚定的光芒。

"准备好了。"他点点头，"这一次，我们不会再输。"

......
`;
  }
  
  /** 执行自检 */
  private async executeSelfChecks(
    content: string,
    constraints: ConstraintChecklist,
    outline: unknown
  ): Promise<WriterSelfCheck[]> {
    const checks: WriterSelfCheck[] = [];
    
    for (const item of this.selfCheckItems) {
      const check = await this.performSelfCheck(item, content, constraints, outline);
      checks.push(check);
    }
    
    return checks;
  }
  
  /** 执行单个自检项 */
  private async performSelfCheck(
    item: { id: string; name: string; description: string; weight: number },
    content: string,
    constraints: ConstraintChecklist,
    outline: unknown
  ): Promise<WriterSelfCheck> {
    // TODO: 实现实际的自检逻辑
    // 这里返回模拟结果
    
    let passed = true;
    let score = 85;
    let comment = '';
    
    switch (item.id) {
      case 'wc-01':
        const wordCount = this.countWords(content);
        const wordConstraint = constraints.constraints.find(
          c => c.name === '字数要求'
        );
        if (wordConstraint && typeof wordConstraint.value === 'object') {
          const range = wordConstraint.value as { min: number; max: number };
          passed = wordCount >= range.min && wordCount <= range.max;
          score = passed ? 100 : 60;
          comment = `实际字数: ${wordCount}, 要求: ${range.min}-${range.max}`;
        }
        break;
      
      case 'wc-02':
        score = 80;
        comment = '开头设置了悬念，有一定吸引力';
        break;
      
      case 'wc-03':
        score = 90;
        comment = '角色行为符合设定';
        break;
      
      case 'wc-04':
        score = 95;
        comment = '未违反世界观规则';
        break;
      
      case 'wc-05':
        score = 85;
        comment = '剧情有推进，但略显缓慢';
        break;
      
      default:
        score = 85;
    }
    
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      passed: score >= 70,
      score,
      comment
    };
  }
  
  /** 计算字数 */
  private countWords(content: string): number {
    // 中文按字计算，英文按词计算
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = content.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + englishWords.length;
  }
  
  /** 计算总分 */
  calculateTotalScore(selfChecks: WriterSelfCheck[]): number {
    const totalWeight = this.selfCheckItems.reduce((sum, item) => sum + item.weight, 0);
    let weightedSum = 0;
    
    for (const check of selfChecks) {
      const item = this.selfCheckItems.find(i => i.id === check.id);
      if (item) {
        weightedSum += check.score * item.weight;
      }
    }
    
    return Math.round(weightedSum / totalWeight);
  }
}