/**
 * 知识库系统主入口
 */

// 类型导出
export * from './types';

// 接口导出
export * from './interfaces';

// 本地实现
export { LocalKnowledgeBase } from './local/LocalKnowledgeBase';
export { LocalKnowledgeBaseImpl } from './local/LocalKnowledgeBaseImpl';
export { LocalKnowledgeBaseFull } from './local/LocalKnowledgeBaseFull';

// 云端实现(预留)
export { CloudKnowledgeBase } from './cloud/CloudKnowledgeBase';

// 场景策略
export { SceneStrategy } from './strategies/SceneStrategy';

// 工厂和提供者
export {
  KnowledgeBaseFactory,
  KnowledgeBaseProvider,
  getKnowledgeBase,
  getDefaultKnowledgeBase
} from './KnowledgeBaseFactory';

// 导入工具
export {
  KnowledgeImporter,
  importKnowledge,
  ImportConfig,
  ImportResult
} from './KnowledgeImporter';
