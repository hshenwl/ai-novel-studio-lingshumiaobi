/**
 * 工作流状态机
 */

import {
  WorkflowState,
  AuditResult,
  AgentType
} from '../types/index.js';

/** 状态转换规则 */
interface TransitionRule {
  from: WorkflowState;
  to: WorkflowState;
  agent: AgentType;
  condition?: (context: StateContext) => boolean;
}

/** 状态上下文 */
interface StateContext {
  auditResult?: AuditResult;
  retryCount?: number;
  maxRetries?: number;
  [key: string]: unknown;
}

/** 状态机类 */
export class StateMachine {
  private transitions: Map<WorkflowState, TransitionRule[]>;
  private currentState: WorkflowState;
  
  constructor(initialState: WorkflowState = WorkflowState.PENDING) {
    this.currentState = initialState;
    this.transitions = new Map();
    this.initializeTransitions();
  }
  
  /** 初始化状态转换规则 */
  private initializeTransitions(): void {
    // 规划流程
    this.addTransition({
      from: WorkflowState.PENDING,
      to: WorkflowState.PLANNING,
      agent: AgentType.PLANNER
    });
    
    this.addTransition({
      from: WorkflowState.PLANNING,
      to: WorkflowState.PLANNED,
      agent: AgentType.PLANNER
    });
    
    // 写作流程
    this.addTransition({
      from: WorkflowState.PLANNED,
      to: WorkflowState.WRITING,
      agent: AgentType.WRITER
    });
    
    this.addTransition({
      from: WorkflowState.WRITING,
      to: WorkflowState.WRITTEN,
      agent: AgentType.WRITER
    });
    
    // 深度阅读流程
    this.addTransition({
      from: WorkflowState.WRITTEN,
      to: WorkflowState.DEEP_READING,
      agent: AgentType.DEEP_READER
    });
    
    this.addTransition({
      from: WorkflowState.DEEP_READING,
      to: WorkflowState.DEEP_READ_DONE,
      agent: AgentType.DEEP_READER
    });
    
    // 深度编辑流程
    this.addTransition({
      from: WorkflowState.DEEP_READ_DONE,
      to: WorkflowState.DEEP_EDITING,
      agent: AgentType.DEEP_EDITOR
    });
    
    this.addTransition({
      from: WorkflowState.DEEP_EDITING,
      to: WorkflowState.DEEP_EDIT_DONE,
      agent: AgentType.DEEP_EDITOR
    });
    
    // 审核流程
    this.addTransition({
      from: WorkflowState.DEEP_EDIT_DONE,
      to: WorkflowState.AUDITING,
      agent: AgentType.AUDITOR
    });
    
    this.addTransition({
      from: WorkflowState.AUDITING,
      to: WorkflowState.AUDIT_DONE,
      agent: AgentType.AUDITOR
    });
    
    // 审核通过 -> 沉淀
    this.addTransition({
      from: WorkflowState.AUDIT_DONE,
      to: WorkflowState.SETTLING,
      agent: AgentType.SETTLER,
      condition: (ctx) => ctx.auditResult === AuditResult.PASS
    });
    
    // 沉淀完成
    this.addTransition({
      from: WorkflowState.SETTLING,
      to: WorkflowState.COMPLETED,
      agent: AgentType.SETTLER
    });
    
    // 小修订/大修订 -> 修订
    this.addTransition({
      from: WorkflowState.AUDIT_DONE,
      to: WorkflowState.REVISING,
      agent: AgentType.REVISER,
      condition: (ctx) => 
        ctx.auditResult === AuditResult.MINOR_REVISE || 
        ctx.auditResult === AuditResult.MAJOR_REVISE
    });
    
    // 修订完成
    this.addTransition({
      from: WorkflowState.REVISING,
      to: WorkflowState.REVISED,
      agent: AgentType.REVISER
    });
    
    // 重新审核
    this.addTransition({
      from: WorkflowState.REVISED,
      to: WorkflowState.RE_AUDITING,
      agent: AgentType.AUDITOR
    });
    
    // 重新审核完成
    this.addTransition({
      from: WorkflowState.RE_AUDITING,
      to: WorkflowState.AUDIT_DONE,
      agent: AgentType.AUDITOR
    });
    
    // 重写 -> 回到写作
    this.addTransition({
      from: WorkflowState.AUDIT_DONE,
      to: WorkflowState.WRITING,
      agent: AgentType.WRITER,
      condition: (ctx) => ctx.auditResult === AuditResult.REWRITE
    });
    
    // 阻塞 -> 回到规划
    this.addTransition({
      from: WorkflowState.AUDIT_DONE,
      to: WorkflowState.PLANNING,
      agent: AgentType.PLANNER,
      condition: (ctx) => ctx.auditResult === AuditResult.BLOCKED
    });
    
    // 失败恢复 -> 重试
    this.addTransition({
      from: WorkflowState.FAILED,
      to: WorkflowState.PLANNING,
      agent: AgentType.PLANNER,
      condition: (ctx) => (ctx.retryCount || 0) < (ctx.maxRetries || 3)
    });
  }
  
  /** 添加转换规则 */
  private addTransition(rule: TransitionRule): void {
    if (!this.transitions.has(rule.from)) {
      this.transitions.set(rule.from, []);
    }
    this.transitions.get(rule.from)!.push(rule);
  }
  
  /** 获取当前状态 */
  getCurrentState(): WorkflowState {
    return this.currentState;
  }
  
  /** 设置当前状态 */
  setState(state: WorkflowState): void {
    this.currentState = state;
  }
  
  /** 获取下一个状态和Agent */
  getNextTransition(context: StateContext): { nextState: WorkflowState; agent: AgentType } | null {
    const rules = this.transitions.get(this.currentState);
    if (!rules || rules.length === 0) {
      return null;
    }
    
    // 查找符合条件的转换
    for (const rule of rules) {
      if (!rule.condition || rule.condition(context)) {
        return {
          nextState: rule.to,
          agent: rule.agent
        };
      }
    }
    
    return null;
  }
  
  /** 尝试转换状态 */
  transition(context: StateContext): boolean {
    const next = this.getNextTransition(context);
    if (next) {
      this.currentState = next.nextState;
      return true;
    }
    return false;
  }
  
  /** 获取所有可达状态 */
  getReachableStates(): WorkflowState[] {
    const rules = this.transitions.get(this.currentState);
    return rules?.map(r => r.to) || [];
  }
  
  /** 检查是否为终态 */
  isFinalState(): boolean {
    return this.currentState === WorkflowState.COMPLETED ||
           this.currentState === WorkflowState.BLOCKED ||
           this.currentState === WorkflowState.FAILED;
  }
  
  /** 检查是否可以恢复 */
  canRecover(context: StateContext): boolean {
    return this.currentState === WorkflowState.FAILED &&
           (context.retryCount || 0) < (context.maxRetries || 3);
  }
  
  /** 获取状态转换路径 */
  getStatePath(): WorkflowState[] {
    const path: WorkflowState[] = [WorkflowState.PENDING];
    let state = WorkflowState.PENDING;
    
    while (state !== WorkflowState.COMPLETED) {
      const rules = this.transitions.get(state);
      if (!rules || rules.length === 0) break;
      
      // 选择默认路径（无条件的转换）
      const defaultRule = rules.find(r => !r.condition);
      if (!defaultRule) break;
      
      path.push(defaultRule.to);
      state = defaultRule.to;
    }
    
    return path;
  }
}

/** 状态机工厂 */
export function createWorkflowStateMachine(): StateMachine {
  return new StateMachine(WorkflowState.PENDING);
}
