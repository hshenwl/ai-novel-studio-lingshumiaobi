/**
 * 错误恢复策略
 */

import {
  WorkflowInstance,
  WorkflowError,
  WorkflowState,
  AgentType
} from '../types/index.js';

/** 恢复策略类型 */
export enum RecoveryStrategy {
  /** 重试当前步骤 */
  RETRY_CURRENT = 'retry_current',
  /** 回退到上一个检查点 */
  ROLLBACK_CHECKPOINT = 'rollback_checkpoint',
  /** 跳过当前步骤 */
  SKIP_STEP = 'skip_step',
  /** 回退到规划阶段 */
  RESTART_PLANNING = 'restart_planning',
  /** 人工干预 */
  MANUAL_INTERVENTION = 'manual_intervention'
}

/** 恢复策略配置 */
interface RecoveryConfig {
  strategy: RecoveryStrategy;
  maxAttempts: number;
  backoffMs: number;
  condition?: (error: WorkflowError, instance: WorkflowInstance) => boolean;
}

/** 错误恢复管理器 */
export class ErrorRecoveryManager {
  private strategies: Map<string, RecoveryConfig>;
  private defaultConfig: RecoveryConfig;
  
  constructor() {
    this.strategies = new Map();
    this.defaultConfig = {
      strategy: RecoveryStrategy.RETRY_CURRENT,
      maxAttempts: 3,
      backoffMs: 1000
    };
    
    this.initializeDefaultStrategies();
  }
  
  /** 初始化默认策略 */
  private initializeDefaultStrategies(): void {
    // Agent失败策略
    this.strategies.set('agent_failure', {
      strategy: RecoveryStrategy.RETRY_CURRENT,
      maxAttempts: 3,
      backoffMs: 2000
    });
    
    // 超时策略
    this.strategies.set('timeout', {
      strategy: RecoveryStrategy.RETRY_CURRENT,
      maxAttempts: 2,
      backoffMs: 5000
    });
    
    // 验证错误策略
    this.strategies.set('validation_error', {
      strategy: RecoveryStrategy.ROLLBACK_CHECKPOINT,
      maxAttempts: 1,
      backoffMs: 0
    });
    
    // 系统错误策略
    this.strategies.set('system_error', {
      strategy: RecoveryStrategy.ROLLBACK_CHECKPOINT,
      maxAttempts: 2,
      backoffMs: 3000
    });
  }
  
  /** 确定恢复策略 */
  determineStrategy(
    error: WorkflowError,
    instance: WorkflowInstance
  ): RecoveryConfig {
    const config = this.strategies.get(error.type) || this.defaultConfig;
    
    // 检查是否有自定义条件
    if (config.condition && !config.condition(error, instance)) {
      // 使用备用策略
      return {
        ...this.defaultConfig,
        strategy: RecoveryStrategy.MANUAL_INTERVENTION
      };
    }
    
    // 检查重试次数
    if (instance.retryCount >= config.maxAttempts) {
      // 超过最大重试次数，需要人工干预
      return {
        ...config,
        strategy: RecoveryStrategy.MANUAL_INTERVENTION
      };
    }
    
    return config;
  }
  
  /** 执行恢复 */
  async executeRecovery(
    error: WorkflowError,
    instance: WorkflowInstance,
    config: RecoveryConfig
  ): Promise<{
    success: boolean;
    newState?: WorkflowState;
    message: string;
  }> {
    switch (config.strategy) {
      case RecoveryStrategy.RETRY_CURRENT:
        return this.retryCurrent(instance, config);
      
      case RecoveryStrategy.ROLLBACK_CHECKPOINT:
        return this.rollbackCheckpoint(instance);
      
      case RecoveryStrategy.SKIP_STEP:
        return this.skipStep(instance);
      
      case RecoveryStrategy.RESTART_PLANNING:
        return this.restartPlanning(instance);
      
      case RecoveryStrategy.MANUAL_INTERVENTION:
        return this.requestManualIntervention(error, instance);
      
      default:
        return {
          success: false,
          message: 'Unknown recovery strategy'
        };
    }
  }
  
  /** 重试当前步骤 */
  private async retryCurrent(
    instance: WorkflowInstance,
    config: RecoveryConfig
  ): Promise<{ success: boolean; message: string }> {
    instance.retryCount++;
    
    // 指数退避
    const delay = config.backoffMs * Math.pow(2, instance.retryCount - 1);
    await this.sleep(delay);
    
    return {
      success: true,
      message: `Retrying (attempt ${instance.retryCount}/${config.maxAttempts})`
    };
  }
  
  /** 回退到检查点 */
  private async rollbackCheckpoint(
    instance: WorkflowInstance
  ): Promise<{ success: boolean; message: string }> {
    const lastCheckpoint = instance.checkpoints[instance.checkpoints.length - 1];
    
    if (!lastCheckpoint) {
      return {
        success: false,
        message: 'No checkpoint available for rollback'
      };
    }
    
    // 恢复状态
    instance.currentState = lastCheckpoint.state;
    instance.metadata = {
      ...instance.metadata,
      ...lastCheckpoint.snapshot
    };
    
    return {
      success: true,
      message: `Rolled back to checkpoint at state ${lastCheckpoint.state}`
    };
  }
  
  /** 跳过当前步骤 */
  private async skipStep(
    instance: WorkflowInstance
  ): Promise<{ success: boolean; message: string }> {
    // 跳过当前步骤，进入下一个状态
    // 这需要根据具体的状态机逻辑实现
    return {
      success: true,
      message: 'Current step skipped'
    };
  }
  
  /** 重启规划 */
  private async restartPlanning(
    instance: WorkflowInstance
  ): Promise<{ success: boolean; message: string }> {
    instance.currentState = WorkflowState.PENDING;
    instance.retryCount = 0;
    
    return {
      success: true,
      message: 'Restarted from planning phase'
    };
  }
  
  /** 请求人工干预 */
  private async requestManualIntervention(
    error: WorkflowError,
    instance: WorkflowInstance
  ): Promise<{ success: boolean; message: string }> {
    // 标记需要人工干预
    instance.metadata.requiresIntervention = true;
    instance.metadata.interventionReason = error.message;
    
    return {
      success: false,
      message: 'Manual intervention required'
    };
  }
  
  /** 辅助函数：睡眠 */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /** 注册自定义策略 */
  registerStrategy(errorType: string, config: RecoveryConfig): void {
    this.strategies.set(errorType, config);
  }
}

/** 创建错误恢复管理器 */
export function createErrorRecoveryManager(): ErrorRecoveryManager {
  return new ErrorRecoveryManager();
}