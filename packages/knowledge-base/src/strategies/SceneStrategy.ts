/**
 * 场景推荐策略实现
 */

import {
  CreationScene,
  KnowledgeCategory,
  ConstraintType,
  RecommendationResult,
  CategoryRecommendation,
  ConstraintItem,
  RecommendationPriority,
  KnowledgeEntry
} from '../types';
import { ISceneStrategy, DEFAULT_SCENE_STRATEGY } from '../interfaces';

export class SceneStrategy implements ISceneStrategy {
  private strategyMap: Map<CreationScene, {
    primaryCategories: KnowledgeCategory[];
    secondaryCategories: KnowledgeCategory[];
    constraintTypes: ConstraintType[];
  }>;

  constructor() {
    this.strategyMap = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // 世界设定: world/, reference/
    this.strategyMap.set(CreationScene.WORLD_SETTING, {
      primaryCategories: [KnowledgeCategory.WORLD, KnowledgeCategory.REFERENCE],
      secondaryCategories: [KnowledgeCategory.TUTORIALS],
      constraintTypes: [ConstraintType.SETTING, ConstraintType.TECHNIQUE]
    });

    // 卷纲生成: techniques/, plots/, world/
    this.strategyMap.set(CreationScene.VOLUME_OUTLINE, {
      primaryCategories: [KnowledgeCategory.TECHNIQUES, KnowledgeCategory.PLOTS, KnowledgeCategory.WORLD],
      secondaryCategories: [KnowledgeCategory.REFERENCE],
      constraintTypes: [ConstraintType.PLOT, ConstraintType.SETTING, ConstraintType.TECHNIQUE]
    });

    // 章纲生成: tutorials/, techniques/, plots/
    this.strategyMap.set(CreationScene.CHAPTER_OUTLINE, {
      primaryCategories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES, KnowledgeCategory.PLOTS],
      secondaryCategories: [KnowledgeCategory.CHARACTERS],
      constraintTypes: [ConstraintType.PLOT, ConstraintType.TECHNIQUE]
    });

    // 正文生成: scenes/, characters/, tutorials/
    this.strategyMap.set(CreationScene.CONTENT_GENERATION, {
      primaryCategories: [KnowledgeCategory.SCENES, KnowledgeCategory.CHARACTERS, KnowledgeCategory.TUTORIALS],
      secondaryCategories: [KnowledgeCategory.WORLD],
      constraintTypes: [ConstraintType.CHARACTER, ConstraintType.STYLE, ConstraintType.TECHNIQUE]
    });

    // 人物塑造: characters/, tutorials/
    this.strategyMap.set(CreationScene.CHARACTER_BUILDING, {
      primaryCategories: [KnowledgeCategory.CHARACTERS, KnowledgeCategory.TUTORIALS],
      secondaryCategories: [KnowledgeCategory.WORLD],
      constraintTypes: [ConstraintType.CHARACTER, ConstraintType.TECHNIQUE]
    });

    // 伏笔设计: tutorials/, techniques/, plots/
    this.strategyMap.set(CreationScene.FORESHADOWING, {
      primaryCategories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES, KnowledgeCategory.PLOTS],
      secondaryCategories: [KnowledgeCategory.REFERENCE],
      constraintTypes: [ConstraintType.PLOT, ConstraintType.TECHNIQUE]
    });

    // 爽点设计: operations/, plots/, reference/
    this.strategyMap.set(CreationScene.HIGHLIGHT_DESIGN, {
      primaryCategories: [KnowledgeCategory.OPERATIONS, KnowledgeCategory.PLOTS, KnowledgeCategory.REFERENCE],
      secondaryCategories: [KnowledgeCategory.TUTORIALS],
      constraintTypes: [ConstraintType.BUSINESS, ConstraintType.PLOT, ConstraintType.TECHNIQUE]
    });

    // AI去味: tutorials/, characters/, reference/
    this.strategyMap.set(CreationScene.AI_DETOX, {
      primaryCategories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.CHARACTERS, KnowledgeCategory.REFERENCE],
      secondaryCategories: [KnowledgeCategory.TECHNIQUES],
      constraintTypes: [ConstraintType.STYLE, ConstraintType.CHARACTER, ConstraintType.TECHNIQUE]
    });

    // 审核: reference/, tutorials/, techniques/
    this.strategyMap.set(CreationScene.AUDIT, {
      primaryCategories: [KnowledgeCategory.REFERENCE, KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES],
      secondaryCategories: [KnowledgeCategory.PLOTS],
      constraintTypes: [ConstraintType.TECHNIQUE, ConstraintType.STYLE, ConstraintType.PLOT]
    });
  }

  getRecommendation(scene: CreationScene, entries?: Map<KnowledgeCategory, KnowledgeEntry[]>): RecommendationResult {
    const config = this.strategyMap.get(scene);
    if (!config) {
      return this.getDefaultRecommendation();
    }

    const categories = this.getRecommendedCategories(scene);
    const suggestedEntries = this.getSuggestedEntries(config, entries);
    const constraintTemplate = this.buildConstraintTemplate(config, suggestedEntries);

    return {
      scene,
      categories,
      suggestedEntries,
      constraintTemplate
    };
  }

  getRecommendedCategories(scene: CreationScene): CategoryRecommendation[] {
    const config = this.strategyMap.get(scene);
    if (!config) return [];

    const recommendations: CategoryRecommendation[] = [];

    // 主要分类
    config.primaryCategories.forEach(category => {
      recommendations.push({
        category,
        priority: RecommendationPriority.PRIMARY,
        reason: this.getCategoryReason(scene, category, true),
        expectedConstraints: this.getExpectedConstraints(category)
      });
    });

    // 次要分类
    config.secondaryCategories.forEach(category => {
      recommendations.push({
        category,
        priority: RecommendationPriority.SECONDARY,
        reason: this.getCategoryReason(scene, category, false),
        expectedConstraints: this.getExpectedConstraints(category)
      });
    });

    return recommendations;
  }

  getConstraintTypes(scene: CreationScene): ConstraintType[] {
    const config = this.strategyMap.get(scene);
    return config?.constraintTypes || [];
  }

  requiresKnowledge(scene: CreationScene): boolean {
    // 所有创作场景都需要知识库支持
    return Object.values(CreationScene).includes(scene);
  }

  private getDefaultRecommendation(): RecommendationResult {
    return {
      scene: CreationScene.CONTENT_GENERATION,
      categories: [],
      suggestedEntries: [],
      constraintTemplate: []
    };
  }

  private getSuggestedEntries(
    config: { primaryCategories: KnowledgeCategory[]; secondaryCategories: KnowledgeCategory[] },
    entries?: Map<KnowledgeCategory, KnowledgeEntry[]>
  ): KnowledgeEntry[] {
    if (!entries) return [];

    const result: KnowledgeEntry[] = [];

    // 优先添加主要分类的条目
    for (const category of config.primaryCategories) {
      const categoryEntries = entries.get(category) || [];
      result.push(...categoryEntries.slice(0, 5)); // 每个分类最多5条
    }

    // 补充次要分类
    for (const category of config.secondaryCategories) {
      const categoryEntries = entries.get(category) || [];
      result.push(...categoryEntries.slice(0, 3)); // 每个分类最多3条
    }

    return result;
  }

  private buildConstraintTemplate(
    config: { constraintTypes: ConstraintType[] },
    entries: KnowledgeEntry[]
  ): ConstraintItem[] {
    return entries.slice(0, 10).map((entry, index) => ({
      id: `constraint-${index}`,
      entryId: entry.id,
      category: entry.category,
      title: entry.title,
      content: entry.summary || entry.content.substring(0, 300),
      priority: index < 3 ? ConstraintPriority.CRITICAL : ConstraintPriority.HIGH,
      type: this.inferConstraintType(entry.category),
      sourceFile: entry.source,
      applied: false,
      violated: false
    }));
  }

  private inferConstraintType(category: KnowledgeCategory): ConstraintType {
    const mapping: Partial<Record<KnowledgeCategory, ConstraintType>> = {
      [KnowledgeCategory.WORLD]: ConstraintType.SETTING,
      [KnowledgeCategory.CHARACTERS]: ConstraintType.CHARACTER,
      [KnowledgeCategory.PLOTS]: ConstraintType.PLOT,
      [KnowledgeCategory.TECHNIQUES]: ConstraintType.TECHNIQUE,
      [KnowledgeCategory.TUTORIALS]: ConstraintType.TECHNIQUE,
      [KnowledgeCategory.OPERATIONS]: ConstraintType.BUSINESS,
      [KnowledgeCategory.SCENES]: ConstraintType.STYLE,
      [KnowledgeCategory.REFERENCE]: ConstraintType.TECHNIQUE
    };
    return mapping[category] || ConstraintType.TECHNIQUE;
  }

  private getCategoryReason(scene: CreationScene, category: KnowledgeCategory, isPrimary: boolean): string {
    const reasons: Record<string, string> = {
      'world_setting:world': '世界观设定是核心依据',
      'world_setting:reference': '参考材料提供灵感',
      'volume_outline:techniques': '技法指导卷纲结构',
      'volume_outline:plots': '剧情参考提供模板',
      'volume_outline:world': '世界观约束剧情走向',
      'chapter_outline:tutorials': '教程指导章节设计',
      'chapter_outline:techniques': '技法优化节奏',
      'chapter_outline:plots': '剧情参考提供桥段',
      'content_generation:scenes': '场景写法提升描写',
      'content_generation:characters': '人物描写增强角色',
      'content_generation:tutorials': '教程指导写作技巧',
      'character_building:characters': '人物素材塑造形象',
      'character_building:tutorials': '教程指导人物设计',
      'foreshadowing:tutorials': '教程指导伏笔技法',
      'foreshadowing:techniques': '技法优化伏笔设计',
      'foreshadowing:plots': '剧情参考提供伏笔案例',
      'highlight_design:operations': '运营经验设计爽点',
      'highlight_design:plots': '剧情参考提供爽点模板',
      'highlight_design:reference': '参考材料激发创意',
      'ai_detox:tutorials': '教程去除AI痕迹',
      'ai_detox:characters': '人物描写增加真实感',
      'ai_detox:reference': '参考材料提升文笔',
      'audit:reference': '参考材料校验质量',
      'audit:tutorials': '教程指导审核要点',
      'audit:techniques': '技法优化审核标准'
    };

    const key = `${scene}:${category}`;
    return reasons[key] || (isPrimary ? '核心参考资料' : '辅助参考资料');
  }

  private getExpectedConstraints(category: KnowledgeCategory): ConstraintType[] {
    const mapping: Partial<Record<KnowledgeCategory, ConstraintType[]>> = {
      [KnowledgeCategory.WORLD]: [ConstraintType.SETTING],
      [KnowledgeCategory.CHARACTERS]: [ConstraintType.CHARACTER],
      [KnowledgeCategory.PLOTS]: [ConstraintType.PLOT],
      [KnowledgeCategory.TECHNIQUES]: [ConstraintType.TECHNIQUE],
      [KnowledgeCategory.TUTORIALS]: [ConstraintType.TECHNIQUE, ConstraintType.STYLE],
      [KnowledgeCategory.OPERATIONS]: [ConstraintType.BUSINESS],
      [KnowledgeCategory.SCENES]: [ConstraintType.STYLE],
      [KnowledgeCategory.REFERENCE]: [ConstraintType.TECHNIQUE, ConstraintType.STYLE]
    };
    return mapping[category] || [ConstraintType.TECHNIQUE];
  }
}
