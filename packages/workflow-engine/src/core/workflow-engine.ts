/**
 * 工作流引擎核心类
 * 实现七步创作工作流的完整生命周期管理
 */

import {
  WorkflowState,
  WorkflowInstance,
  WorkflowProgress,
  WorkflowConfig,
  WorkflowError,
  Checkpoint,
  StateTransition,
  AgentType,
  AuditResult,
  AgentContext,
  AgentResult,
  ConstraintChecklist,
  AuditFeedback,
  WorkflowConfig as IWorkflowConfig
} from '../types/index.js';
import { StateMachine, createWorkflowStateMachine } from './state-machine.js';
import { IAgent } from '../types/index.js';
import {
  PlannerAgent,
  WriterAgent,
  DeepReaderAgent,
  DeepEditorAgent,
  AuditorAgent,
  ReviserAgent,
  SettlerAgent
} from '../agents/index.js';

/** 工作流引擎事件 */
export enum WorkflowEvent {
  STATE_CHANGED = 'state_changed',
  AGENT_STARTED = 'agent_started',
  AGENT_COMPLETED = 'agent_completed',
  AGENT_FAILED = 'agent_failed',
  CHECKPOINT_SAVED = 'checkpoint_saved',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  PROGRESS_UPDATED = 'progress_updated'
}

/** 事件监听器 */
type EventListener = (data: unknown) => void;

/** 工作流引擎配置 */
export interface WorkflowEngineOptions {
  config?: Partial<WorkflowConfig>;
  aiClient?: unknown;
  dbClient?: unknown;
}

/** 工作流引擎 */
export class WorkflowEngine {
  private stateMachine: StateMachine;
  private agents: Map<AgentType, IAgent>;
  private instances: Map<string, WorkflowInstance>;
  private config: WorkflowConfig;
  private eventListeners: Map<WorkflowEvent, EventListener[]>;
  private aiClient: unknown;
  private dbClient: unknown;
  
  constructor(options: WorkflowEngineOptions = {}) {
    this.stateMachine = createWorkflowStateMachine();
    this.instances = new Map();
    this.eventListeners = new Map();
    
    // 默认配置
    this.config = {
      maxRetries: 3,
      timeout: 300000, // 5分钟
      enableCheckpoint: true,
      checkpointInterval: 60000, // 1分钟
      enableAutoRecovery: true,
      auditThreshold: {
        pass: 80,
        minorRevise: 70,
        majorRevise: 60,
        rewrite: 50
      },
      maxRevisionRounds: 3,
      dehumanizeModes: [],
      ...options.config
    };
    
    this.aiClient = options.aiClient;
    this.dbClient = options.dbClient;
    
    // 初始化Agent
    this.agents = this.initializeAgents();
  }
  
  /** 初始化所有Agent */
  private initializeAgents(): Map<AgentType, IAgent> {
    const agents = new Map<AgentType, IAgent>();
    const dependencies = {
      aiClient: this.aiClient,
      dbClient: this.dbClient
    };
    
    agents.set(AgentType.PLANNER, new PlannerAgent(dependencies));
    agents.set(AgentType.WRITER, new WriterAgent(dependencies));
    agents.set(AgentType.DEEP_READER, new DeepReaderAgent(dependencies));
    agents.set(AgentType.DEEP_EDITOR, new DeepEditorAgent(dependencies));
    agents.set(AgentType.AUDITOR, new AuditorAgent(dependencies));
    agents.set(AgentType.REVISER, new ReviserAgent(dependencies));
    agents.set(AgentType.SETTLER, new SettlerAgent(dependencies));
    
    return agents;
  }
  
  // ==================== 工作流生命周期 ====================
  
  /** 创建工作流实例 */
  async createInstance(params: {
    projectId: string;
    chapterId: string;
    chapterOutline?: unknown;
    styleProfile?: unknown;
    metadata?: Record<string, unknown>;
  }): Promise<WorkflowInstance> {
    const instance: WorkflowInstance = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: params.projectId,
      chapterId: params.chapterId,
      currentState: WorkflowState.PENDING,
      stateHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      checkpoints: [],
      errors: [],
      retryCount: 0,
      metadata: params.metadata || {}
    };
    
    this.instances.set(instance.id, instance);
    
    // 保存初始检查点
    if (this.config.enableCheckpoint) {
      await this.saveCheckpoint(instance);
    }
    
    this.emit(WorkflowEvent.STATE_CHANGED, {
      instanceId: instance.id,
      state: instance.currentState
    });
    
    return instance;
  }
  
  /** 启动工作流 */
  async start(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    // 主工作流循环
    await this.runWorkflowLoop(instance);
  }
  
  /** 主工作流循环 */
  private async runWorkflowLoop(instance: WorkflowInstance): Promise<void> {
    const sm = new StateMachine(instance.currentState);
    
    while (!sm.isFinalState()) {
      try {
        // 获取下一个转换
        const context = this.buildStateContext(instance);
        const transition = sm.getNextTransition(context);
        
        if (!transition) {
          // 无法继续，可能是阻塞状态
          await this.handleBlockedState(instance);
          break;
        }
        
        // 执行Agent
        const result = await this.executeAgent(
          instance,
          transition.agent,
          context
        );
        
        if (result.success) {
          // 状态转换
          await this.transitionState(instance, transition.nextState, transition.agent, result.duration);
          
          // 保存Agent输出到实例
          this.updateInstanceData(instance, transition.agent, result.data);
          
          // 保存检查点
          if (this.config.enableCheckpoint) {
            await this.saveCheckpoint(instance);
          }
        } else {
          // Agent执行失败
          await this.handleAgentFailure(instance, transition.agent, result.error || 'Unknown error');
        }
        
      } catch (error) {
        await this.handleError(instance, error);
        
        if (!this.config.enableAutoRecovery) {
          break;
        }
      }
    }
    
    // 工作流完成
    if (instance.currentState === WorkflowState.COMPLETED) {
      this.emit(WorkflowEvent.WORKFLOW_COMPLETED, { instanceId: instance.id });
    } else if (instance.currentState === WorkflowState.FAILED) {
      this.emit(WorkflowEvent.WORKFLOW_FAILED, { instanceId: instance.id });
    }
  }
  
  /** 执行Agent */
  private async executeAgent(
    instance: WorkflowInstance,
    agentType: AgentType,
    stateContext: Record<string, unknown>
  ): Promise<AgentResult> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent not found: ${agentType}`);
    }
    
    this.emit(WorkflowEvent.AGENT_STARTED, {
      instanceId: instance.id,
      agent: agentType
    });
    
    // 构建Agent上下文
    const context: AgentContext = {
      projectId: instance.projectId,
      chapterId: instance.chapterId,
      currentState: instance.currentState,
      ...stateContext as AgentContext
    };
    
    // 带超时执行
    const result = await this.executeWithTimeout(
      agent.execute(context),
      this.config.timeout
    );
    
    this.emit(WorkflowEvent.AGENT_COMPLETED, {
      instanceId: instance.id,
      agent: agentType,
      success: result.success,
      duration: result.duration
    });
    
    return result;
  }
  
  /** 带超时执行 */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout);
      })
    ]);
  }
  
  /** 状态转换 */
  private async transitionState(
    instance: WorkflowInstance,
    newState: WorkflowState,
    agent: AgentType,
    duration: number
  ): Promise<void> {
    const transition: StateTransition = {
      from: instance.currentState,
      to: newState,
      timestamp: new Date(),
      agent,
      duration
    };
    
    instance.stateHistory.push(transition);
    instance.currentState = newState;
    instance.updatedAt = new Date();
    
    this.emit(WorkflowEvent.STATE_CHANGED, {
      instanceId: instance.id,
      from: transition.from,
      to: transition.to,
      agent
    });
    
    // 更新进度
    this.emit(WorkflowEvent.PROGRESS_UPDATED, {
      instanceId: instance.id,
      progress: this.getProgress(instance.id)
    });
  }
  
  /** 构建状态上下文 */
  private buildStateContext(instance: WorkflowInstance): Record<string, unknown> {
    const data = instance.metadata;
    
    // 根据当前状态添加特定上下文
    if (instance.currentState === WorkflowState.AUDIT_DONE) {
      return {
        ...data,
        auditResult: (data.auditResult as AuditFeedback)?.result
      };
    }
    
    return {
      ...data,
      retryCount: instance.retryCount,
      maxRetries: this.config.maxRetries
    };
  }
  
  /** 更新实例数据 */
  private updateInstanceData(
    instance: WorkflowInstance,
    agentType: AgentType,
    data: unknown
  ): void {
    switch (agentType) {
      case AgentType.PLANNER:
        instance.metadata.constraints = data as ConstraintChecklist;
        break;
      case AgentType.WRITER:
        instance.metadata.content = data as string;
        break;
      case AgentType.DEEP_READER:
        instance.metadata.deepReaderResult = data;
        break;
      case AgentType.DEEP_EDITOR:
        instance.metadata.deepEditorResult = data;
        break;
      case AgentType.AUDITOR:
        instance.metadata.auditResult = data as AuditFeedback;
        break;
      case AgentType.REVISER:
        instance.metadata.revisedContent = (data as { revisedContent: string })?.revisedContent;
        instance.metadata.content = (data as { revisedContent: string })?.revisedContent;
        break;
      case AgentType.SETTLER:
        instance.metadata.settlerResult = data;
        break;
    }
  }
  
  // ==================== 错误处理与恢复 ====================
  
  /** 处理Agent失败 */
  private async handleAgentFailure(
    instance: WorkflowInstance,
    agent: AgentType,
    error: string
  ): Promise<void> {
    const workflowError: WorkflowError = {
      id: `err-${Date.now()}`,
      state: instance.currentState,
      type: 'agent_failure',
      message: error,
      timestamp: new Date(),
      handled: false
    };
    
    instance.errors.push(workflowError);
    
    this.emit(WorkflowEvent.AGENT_FAILED, {
      instanceId: instance.id,
      agent,
      error
    });
    
    // 尝试恢复
    if (this.config.enableAutoRecovery && instance.retryCount < this.config.maxRetries) {
      instance.retryCount++;
      await this.recoverFromFailure(instance);
    } else {
      // 转入失败状态
      await this.transitionState(instance, WorkflowState.FAILED, agent, 0);
      workflowError.handled = true;
    }
  }
  
  /** 处理错误 */
  private async handleError(instance: WorkflowInstance, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const workflowError: WorkflowError = {
      id: `err-${Date.now()}`,
      state: instance.currentState,
      type: 'system_error',
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      handled: false
    };
    
    instance.errors.push(workflowError);
    
    if (this.config.enableAutoRecovery && instance.retryCount < this.config.maxRetries) {
      instance.retryCount++;
      await this.recoverFromFailure(instance);
    } else {
      await this.transitionState(
        instance,
        WorkflowState.FAILED,
        AgentType.PLANNER,
        0
      );
      workflowError.handled = true;
    }
  }
  
  /** 从失败中恢复 */
  private async recoverFromFailure(instance: WorkflowInstance): Promise<void> {
    // 查找最近的检查点
    const lastCheckpoint = instance.checkpoints[instance.checkpoints.length - 1];
    
    if (lastCheckpoint) {
      // 恢复到检查点状态
      instance.currentState = lastCheckpoint.state;
      instance.metadata = {
        ...instance.metadata,
        ...lastCheckpoint.snapshot
      };
      
      // 重新创建状态机
      this.stateMachine = new StateMachine(instance.currentState);
    }
  }
  
  /** 处理阻塞状态 */
  private async handleBlockedState(instance: WorkflowInstance): Promise<void> {
    // 根据业务逻辑处理阻塞
    // 可能需要人工干预或重新规划
    await this.transitionState(
      instance,
      WorkflowState.BLOCKED,
      AgentType.PLANNER,
      0
    );
  }
  
  // ==================== 断点续跑 ====================
  
  /** 保存检查点 */
  private async saveCheckpoint(instance: WorkflowInstance): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      id: `cp-${Date.now()}`,
      state: instance.currentState,
      createdAt: new Date(),
      snapshot: { ...instance.metadata }
    };
    
    instance.checkpoints.push(checkpoint);
    
    this.emit(WorkflowEvent.CHECKPOINT_SAVED, {
      instanceId: instance.id,
      checkpointId: checkpoint.id,
      state: checkpoint.state
    });
    
    return checkpoint;
  }
  
  /** 从检查点恢复 */
  async resumeFromCheckpoint(instanceId: string, checkpointId?: string): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    let checkpoint: Checkpoint | undefined;
    
    if (checkpointId) {
      checkpoint = instance.checkpoints.find(cp => cp.id === checkpointId);
    } else {
      // 使用最近的检查点
      checkpoint = instance.checkpoints[instance.checkpoints.length - 1];
    }
    
    if (!checkpoint) {
      throw new Error('No checkpoint found for recovery');
    }
    
    // 恢复状态
    instance.currentState = checkpoint.state;
    instance.metadata = {
      ...instance.metadata,
      ...checkpoint.snapshot
    };
    
    // 重置状态机
    this.stateMachine = new StateMachine(instance.currentState);
    
    // 继续执行
    await this.runWorkflowLoop(instance);
  }
  
  /** 获取所有检查点 */
  getCheckpoints(instanceId: string): Checkpoint[] {
    const instance = this.getInstance(instanceId);
    return instance?.checkpoints || [];
  }
  
  // ==================== 进度追踪 ====================
  
  /** 获取进度 */
  getProgress(instanceId: string): WorkflowProgress {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    const completedSteps = this.getCompletedSteps(instance);
    const currentStep = this.getCurrentStep(instance.currentState);
    const pendingSteps = this.getPendingSteps(instance.currentState);
    
    const percentage = Math.round(
      (completedSteps.length / (completedSteps.length + pendingSteps.length + 1)) * 100
    );
    
    return {
      instanceId: instance.id,
      currentState: instance.currentState,
      percentage,
      completedSteps,
      currentStep,
      pendingSteps,
      startedAt: instance.createdAt,
      message: this.getProgressMessage(instance.currentState)
    };
  }
  
  /** 获取已完成步骤 */
  private getCompletedSteps(instance: WorkflowInstance): AgentType[] {
    const steps: AgentType[] = [];
    const stateToAgent: Partial<Record<WorkflowState, AgentType>> = {
      [WorkflowState.PLANNED]: AgentType.PLANNER,
      [WorkflowState.WRITTEN]: AgentType.WRITER,
      [WorkflowState.DEEP_READ_DONE]: AgentType.DEEP_READER,
      [WorkflowState.DEEP_EDIT_DONE]: AgentType.DEEP_EDITOR,
      [WorkflowState.AUDIT_DONE]: AgentType.AUDITOR,
      [WorkflowState.REVISED]: AgentType.REVISER,
      [WorkflowState.COMPLETED]: AgentType.SETTLER
    };
    
    for (const transition of instance.stateHistory) {
      const agent = stateToAgent[transition.to];
      if (agent && !steps.includes(agent)) {
        steps.push(agent);
      }
    }
    
    return steps;
  }
  
  /** 获取当前步骤 */
  private getCurrentStep(state: WorkflowState): AgentType | undefined {
    const stateToAgent: Partial<Record<WorkflowState, AgentType>> = {
      [WorkflowState.PLANNING]: AgentType.PLANNER,
      [WorkflowState.WRITING]: AgentType.WRITER,
      [WorkflowState.DEEP_READING]: AgentType.DEEP_READER,
      [WorkflowState.DEEP_EDITING]: AgentType.DEEP_EDITOR,
      [WorkflowState.AUDITING]: AgentType.AUDITOR,
      [WorkflowState.REVISING]: AgentType.REVISER,
      [WorkflowState.SETTLING]: AgentType.SETTLER
    };
    
    return stateToAgent[state];
  }
  
  /** 获取待执行步骤 */
  private getPendingSteps(state: WorkflowState): AgentType[] {
    const allSteps = [
      AgentType.PLANNER,
      AgentType.WRITER,
      AgentType.DEEP_READER,
      AgentType.DEEP_EDITOR,
      AgentType.AUDITOR,
      AgentType.SETTLER
    ];
    
    const stateIndex = [
      WorkflowState.PENDING,
      WorkflowState.PLANNING,
      WorkflowState.PLANNED,
      WorkflowState.WRITING,
      WorkflowState.WRITTEN,
      WorkflowState.DEEP_READING,
      WorkflowState.DEEP_READ_DONE,
      WorkflowState.DEEP_EDITING,
      WorkflowState.DEEP_EDIT_DONE,
      WorkflowState.AUDITING,
      WorkflowState.AUDIT_DONE,
      WorkflowState.SETTLING,
      WorkflowState.COMPLETED
    ].indexOf(state);
    
    // 根据当前状态返回剩余步骤
    if (stateIndex < 3) return allSteps;
    if (stateIndex < 5) return allSteps.slice(1);
    if (stateIndex < 7) return allSteps.slice(2);
    if (stateIndex < 9) return allSteps.slice(3);
    if (stateIndex < 11) return allSteps.slice(4);
    if (stateIndex < 12) return allSteps.slice(5);
    return [];
  }
  
  /** 获取进度消息 */
  private getProgressMessage(state: WorkflowState): string {
    const messages: Partial<Record<WorkflowState, string>> = {
      [WorkflowState.PENDING]: '等待开始...',
      [WorkflowState.PLANNING]: '正在规划创作约束...',
      [WorkflowState.PLANNED]: '规划完成',
      [WorkflowState.WRITING]: '正在生成正文...',
      [WorkflowState.WRITTEN]: '正文生成完成',
      [WorkflowState.DEEP_READING]: '正在进行读者体验评估...',
      [WorkflowState.DEEP_READ_DONE]: '读者评估完成',
      [WorkflowState.DEEP_EDITING]: '正在进行编辑审核...',
      [WorkflowState.DEEP_EDIT_DONE]: '编辑审核完成',
      [WorkflowState.AUDITING]: '正在进行综合审核...',
      [WorkflowState.AUDIT_DONE]: '审核完成',
      [WorkflowState.REVISING]: '正在修订内容...',
      [WorkflowState.REVISED]: '修订完成',
      [WorkflowState.SETTLING]: '正在沉淀数据...',
      [WorkflowState.COMPLETED]: '工作流已完成',
      [WorkflowState.BLOCKED]: '工作流已阻塞',
      [WorkflowState.FAILED]: '工作流失败'
    };
    
    return messages[state] || '处理中...';
  }
  
  // ==================== 实例管理 ====================
  
  /** 获取实例 */
  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }
  
  /** 获取所有实例 */
  getAllInstances(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }
  
  /** 删除实例 */
  deleteInstance(instanceId: string): boolean {
    return this.instances.delete(instanceId);
  }
  
  // ==================== 事件系统 ====================
  
  /** 添加事件监听 */
  on(event: WorkflowEvent, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }
  
  /** 移除事件监听 */
  off(event: WorkflowEvent, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /** 触发事件 */
  private emit(event: WorkflowEvent, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }
  
  // ==================== 暂停与恢复 ====================
  
  /** 暂停工作流 */
  async pause(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    // 保存检查点
    if (this.config.enableCheckpoint) {
      await this.saveCheckpoint(instance);
    }
    
    // 标记为暂停（实际实现需要更复杂的状态管理）
    instance.metadata.paused = true;
  }
  
  /** 恢复工作流 */
  async resume(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    instance.metadata.paused = false;
    
    // 继续执行
    await this.runWorkflowLoop(instance);
  }
  
  /** 取消工作流 */
  async cancel(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }
    
    // 转入失败状态
    instance.currentState = WorkflowState.FAILED;
    instance.updatedAt = new Date();
    instance.metadata.cancelled = true;
  }
}

/** 创建工作流引擎实例 */
export function createWorkflowEngine(options?: WorkflowEngineOptions): WorkflowEngine {
  return new WorkflowEngine(options);
}