/**
 * Agent基础抽象类
 */

import {
  IAgent,
  AgentType,
  AgentContext,
  AgentResult,
  WorkflowState
} from '../types/index.js';

/** Agent基础抽象类 */
export abstract class BaseAgent implements IAgent {
  abstract readonly name: string;
  abstract readonly type: AgentType;
  
  /** 入口状态 */
  protected abstract entryState: WorkflowState;
  /** 成功后目标状态 */
  protected abstract successState: WorkflowState;
  
  /** AI模型客户端 */
  protected aiClient: unknown;
  /** 数据库客户端 */
  protected dbClient: unknown;
  
  constructor(dependencies: {
    aiClient?: unknown;
    dbClient?: unknown;
  }) {
    this.aiClient = dependencies.aiClient;
    this.dbClient = dependencies.dbClient;
  }
  
  /** 执行Agent任务 */
  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // 前置验证
      const validationResult = await this.validate(context);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error,
          duration: Date.now() - startTime
        };
      }
      
      // 执行核心逻辑
      const result = await this.run(context);
      
      return {
        success: true,
        nextState: this.successState,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }
  
  /** 验证输入上下文 */
  protected async validate(context: AgentContext): Promise<{ valid: boolean; error?: string }> {
    if (!context.projectId) {
      return { valid: false, error: 'Missing projectId' };
    }
    if (!context.chapterId) {
      return { valid: false, error: 'Missing chapterId' };
    }
    return { valid: true };
  }
  
  /** 核心执行逻辑，由子类实现 */
  protected abstract run(context: AgentContext): Promise<unknown>;
  
  /** 生成唯一ID */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
