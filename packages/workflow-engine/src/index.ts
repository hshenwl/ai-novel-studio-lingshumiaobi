/**
 * @ai-novel/workflow-engine
 * AI小说创作七步工作流引擎
 */

// 核心类型
export * from './types/index.js';

// 核心引擎
export {
  WorkflowEngine,
  WorkflowEvent,
  createWorkflowEngine,
  WorkflowEngineOptions,
  StateMachine,
  createWorkflowStateMachine,
  BaseAgent
} from './core/index.js';

// Agents
export {
  PlannerAgent,
  WriterAgent,
  DeepReaderAgent,
  DeepEditorAgent,
  AuditorAgent,
  ReviserAgent,
  SettlerAgent
} from './agents/index.js';

// 工具
export {
  ErrorRecoveryManager,
  RecoveryStrategy,
  createErrorRecoveryManager
} from './utils/error-recovery.js';

// 默认导出
import { WorkflowEngine, createWorkflowEngine } from './core/index.js';
export default createWorkflowEngine;
