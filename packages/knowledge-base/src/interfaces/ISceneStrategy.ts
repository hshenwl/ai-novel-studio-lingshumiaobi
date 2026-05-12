/**
 * 场景推荐策略接口
 */

import {
  CreationScene,
  KnowledgeCategory,
  ConstraintType,
  RecommendationResult,
  CategoryRecommendation,
  ConstraintItem,
  RecommendationPriority
} from '../types';

/**
 * 场景推荐策略接口
 */
export interface ISceneStrategy {
  /**
   * 获取场景推荐
   */
  getRecommendation(scene: CreationScene): RecommendationResult;

  /**
   * 获取推荐分类
   */
  getRecommendedCategories(scene: CreationScene): CategoryRecommendation[];

  /**
   * 获取约束类型
   */
  getConstraintTypes(scene: CreationScene): ConstraintType[];

  /**
   * 判断场景是否需要知识库支持
   */
  requiresKnowledge(scene: CreationScene): boolean;
}

/**
 * 场景推荐配置
 */
export interface SceneStrategyConfig {
  // 各场景的推荐配置
  recommendations: Map<CreationScene, SceneRecommendationConfig>;
}

/**
 * 单个场景推荐配置
 */
export interface SceneRecommendationConfig {
  scene: CreationScene;
  primary: {
    categories: KnowledgeCategory[];
    constraints: ConstraintType[];
    priority: RecommendationPriority;
  };
  secondary?: {
    categories: KnowledgeCategory[];
    constraints: ConstraintType[];
    priority: RecommendationPriority;
  };
  description: string;
}

/**
 * 默认场景推荐策略配置
 */
export const DEFAULT_SCENE_STRATEGY: SceneRecommendationConfig[] = [
  {
    scene: CreationScene.WORLD_SETTING,
    primary: {
      categories: [KnowledgeCategory.WORLD, KnowledgeCategory.REFERENCE],
      constraints: [ConstraintType.SETTING, ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.PRIMARY
    },
    description: '世界设定: 读取世界观设定和参考材料'
  },
  {
    scene: CreationScene.VOLUME_OUTLINE,
    primary: {
      categories: [KnowledgeCategory.TECHNIQUES, KnowledgeCategory.PLOTS, KnowledgeCategory.WORLD],
      constraints: [ConstraintType.PLOT, ConstraintType.SETTING, ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.PRIMARY
    },
    description: '卷纲生成: 读取技法、剧情参考和世界观'
  },
  {
    scene: CreationScene.CHAPTER_OUTLINE,
    primary: {
      categories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES, KnowledgeCategory.PLOTS],
      constraints: [ConstraintType.PLOT, ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.PRIMARY
    },
    description: '章纲生成: 读取教程、技法和剧情参考'
  },
  {
    scene: CreationScene.CONTENT_GENERATION,
    primary: {
      categories: [KnowledgeCategory.SCENES, KnowledgeCategory.CHARACTERS],
      constraints: [ConstraintType.CHARACTER, ConstraintType.STYLE],
      priority: RecommendationPriority.PRIMARY
    },
    secondary: {
      categories: [KnowledgeCategory.TUTORIALS],
      constraints: [ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.SECONDARY
    },
    description: '正文生成: 读取场景写法、人物描写和教程'
  },
  {
    scene: CreationScene.CHARACTER_BUILDING,
    primary: {
      categories: [KnowledgeCategory.CHARACTERS, KnowledgeCategory.TUTORIALS],
      constraints: [ConstraintType.CHARACTER, ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.PRIMARY
    },
    description: '人物塑造: 读取人物描写素材和教程'
  },
  {
    scene: CreationScene.FORESHADOWING,
    primary: {
      categories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES, KnowledgeCategory.PLOTS],
      constraints: [ConstraintType.PLOT, ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.PRIMARY
    },
    description: '伏笔设计: 读取教程、技法和剧情参考'
  },
  {
    scene: CreationScene.HIGHLIGHT_DESIGN,
    primary: {
      categories: [KnowledgeCategory.OPERATIONS, KnowledgeCategory.PLOTS],
      constraints: [ConstraintType.BUSINESS, ConstraintType.PLOT],
      priority: RecommendationPriority.PRIMARY
    },
    secondary: {
      categories: [KnowledgeCategory.REFERENCE],
      constraints: [ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.SECONDARY
    },
    description: '爽点设计: 读取运营、剧情参考和阅读材料'
  },
  {
    scene: CreationScene.AI_DETOX,
    primary: {
      categories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.CHARACTERS, KnowledgeCategory.REFERENCE],
      constraints: [ConstraintType.STYLE, ConstraintType.CHARACTER],
      priority: RecommendationPriority.PRIMARY
    },
    description: 'AI去味: 读取教程、人物描写和参考材料'
  },
  {
    scene: CreationScene.AUDIT,
    primary: {
      categories: [KnowledgeCategory.REFERENCE, KnowledgeCategory.TUTORIALS],
      constraints: [ConstraintType.TECHNIQUE, ConstraintType.STYLE],
      priority: RecommendationPriority.PRIMARY
    },
    secondary: {
      categories: [KnowledgeCategory.TECHNIQUES],
      constraints: [ConstraintType.TECHNIQUE],
      priority: RecommendationPriority.SECONDARY
    },
    description: '审核: 读取参考材料、教程和技法'
  }
];
