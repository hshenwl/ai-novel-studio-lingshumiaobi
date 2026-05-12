/**
 * TaskQueue接口 - 任务队列抽象层
 * 支持SQLite本地队列和Redis云端队列切换
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 任务队列类型
 */
export type TaskQueueType = 'sqlite' | 'redis' | 'memory' | 'rabbitmq' | 'sqs';

/**
 * 任务状态
 */
export type TaskStatus =
  | 'pending'      // 等待执行
  | 'queued'       // 已入队
  | 'running'      // 执行中
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'cancelled'    // 已取消
  | 'retrying';    // 重试中

/**
 * 任务优先级
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * 任务队列配置
 */
export interface TaskQueueConfig {
  type: TaskQueueType;
  concurrency: number;
  max_retries: number;
  retry_delay: number;

  // SQLite配置
  sqlite?: {
    database_path: string;
    table_name?: string;
    cleanup_interval?: number;
  };

  // Redis配置
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    prefix?: string;
    cluster?: { nodes: Array<{ host: string; port: number }> };
  };

  // RabbitMQ配置
  rabbitmq?: {
    url: string;
    exchange?: string;
    queue_prefix?: string;
  };

  // AWS SQS配置
  sqs?: {
    region: string;
    queue_url: string;
    access_key_id: string;
    secret_access_key: string;
  };
}

/**
 * 任务定义
 */
export interface TaskDefinition<T = any, R = any> {
  id: string;
  name: string;
  type: string;
  payload: T;
  priority: TaskPriority;
  status: TaskStatus;
  progress?: number;
  result?: R;
  error?: TaskError;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  expires_at?: Date;
  retry_count: number;
  max_retries: number;
  timeout: number;
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * 任务错误
 */
export interface TaskError {
  message: string;
  code?: string;
  stack?: string;
  details?: any;
}

/**
 * 任务选项
 */
export interface TaskOptions {
  priority?: TaskPriority;
  delay?: number;
  timeout?: number;
  max_retries?: number;
  retry_delay?: number;
  expires_at?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * 任务处理器
 */
export type TaskHandler<T = any, R = any> = (
  task: TaskDefinition<T>,
  context: TaskContext
) => Promise<R>;

/**
 * 任务上下文
 */
export interface TaskContext {
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 更新进度
   */
  updateProgress(progress: number): Promise<void>;

  /**
   * 检查是否已取消
   */
  isCancelled(): boolean;

  /**
   * 抛出如果已取消
   */
  throwIfCancelled(): void;

  /**
   * 记录日志
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void;

  /**
   * 创建子任务
   */
  createChildTask<C, D>(
    type: string,
    payload: C,
    options?: TaskOptions
  ): Promise<string>;
}

/**
 * 任务队列统计
 */
export interface TaskQueueStats {
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  average_wait_time: number;
  average_process_time: number;
  by_type: Record<string, number>;
  by_priority: Record<TaskPriority, number>;
}

/**
 * 任务查询选项
 */
export interface TaskQueryOptions {
  status?: TaskStatus | TaskStatus[];
  type?: string | string[];
  priority?: TaskPriority | TaskPriority[];
  tags?: string[];
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'priority' | 'status';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// 核心TaskQueue接口
// ============================================================================

/**
 * 任务队列接口
 */
export interface ITaskQueue {
  /**
   * 初始化任务队列
   */
  initialize(config: TaskQueueConfig): Promise<void>;

  /**
   * 关闭任务队列
   */
  close(): Promise<void>;

  /**
   * 获取队列类型
   */
  getType(): TaskQueueType;

  /**
   * 检查队列是否可用
   */
  isAvailable(): Promise<boolean>;

  // ============================================================================
  // 任务管理
  // ============================================================================

  /**
   * 添加任务
   */
  add<T = any>(
    type: string,
    payload: T,
    options?: TaskOptions
  ): Promise<string>;

  /**
   * 批量添加任务
   */
  addMany<T = any>(
    tasks: Array<{ type: string; payload: T; options?: TaskOptions }>
  ): Promise<string[]>;

  /**
   * 获取任务
   */
  get(taskId: string): Promise<TaskDefinition | null>;

  /**
   * 获取多个任务
   */
  getMany(taskIds: string[]): Promise<TaskDefinition[]>;

  /**
   * 查询任务
   */
  query(options: TaskQueryOptions): Promise<TaskDefinition[]>;

  /**
   * 取消任务
   */
  cancel(taskId: string): Promise<boolean>;

  /**
   * 批量取消任务
   */
  cancelMany(taskIds: string[]): Promise<number>;

  /**
   * 重试失败的任务
   */
  retry(taskId: string): Promise<boolean>;

  /**
   * 批量重试失败的任务
   */
  retryMany(taskIds: string[]): Promise<number>;

  /**
   * 删除任务
   */
  delete(taskId: string): Promise<boolean>;

  /**
   * 批量删除任务
   */
  deleteMany(taskIds: string[]): Promise<number>;

  /**
   * 清理已完成的任务
   */
  cleanup(options?: {
    status?: TaskStatus[];
    before?: Date;
    keep_count?: number;
  }): Promise<number>;

  // ============================================================================
  // 任务处理
  // ============================================================================

  /**
   * 注册任务处理器
   */
  registerHandler<T = any, R = any>(
    type: string,
    handler: TaskHandler<T, R>
  ): void;

  /**
   * 注销任务处理器
   */
  unregisterHandler(type: string): void;

  /**
   * 启动任务处理
   */
  start(): Promise<void>;

  /**
   * 停止任务处理
   */
  stop(): Promise<void>;

  /**
   * 暂停任务处理
   */
  pause(): Promise<void>;

  /**
   * 恢复任务处理
   */
  resume(): Promise<void>;

  /**
   * 检查是否正在处理
   */
  isProcessing(): boolean;

  /**
   * 获取当前正在处理的任务数量
   */
  getActiveCount(): number;

  /**
   * 等待所有任务完成
   */
  waitForCompletion(options?: { timeout?: number }): Promise<void>;

  /**
   * 等待特定任务完成
   */
  waitForTask(taskId: string, options?: { timeout?: number }): Promise<TaskDefinition>;

  // ============================================================================
  // 统计与监控
  // ============================================================================

  /**
   * 获取队列统计信息
   */
  getStats(): Promise<TaskQueueStats>;

  /**
   * 获取队列长度
   */
  getLength(): Promise<number>;

  /**
   * 检查队列是否为空
   */
  isEmpty(): Promise<boolean>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string; details?: any }>;
}

// ============================================================================
// 特化任务接口
// ============================================================================

/**
 * AI生成任务
 */
export interface AIGenerationTaskPayload {
  project_id: string;
  chapter_id?: string;
  prompt: string;
  context: string;
  model: string;
  provider: string;
  generation_type: 'chapter' | 'outline' | 'character' | 'dialogue' | 'description';
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIGenerationTaskResult {
  content: string;
  tokens_used: number;
  model: string;
  provider: string;
  generation_time: number;
}

/**
 * 导出任务
 */
export interface ExportTaskPayload {
  project_id: string;
  format: 'txt' | 'epub' | 'pdf' | 'docx' | 'html';
  chapters?: string[];
  include_metadata?: boolean;
  options?: Record<string, any>;
}

export interface ExportTaskResult {
  file_path: string;
  file_size: number;
  format: string;
  generated_at: Date;
}

/**
 * 备份任务
 */
export interface BackupTaskPayload {
  project_id: string;
  include_assets?: boolean;
  compression?: 'zip' | 'tar' | 'none';
  description?: string;
}

export interface BackupTaskResult {
  backup_id: string;
  file_path: string;
  file_size: number;
  created_at: Date;
}

/**
 * 导入任务
 */
export interface ImportTaskPayload {
  file_path: string;
  project_id?: string;
  format: 'txt' | 'epub' | 'docx';
  options?: Record<string, any>;
}

export interface ImportTaskResult {
  project_id: string;
  imported_chapters: number;
  imported_characters: number;
  warnings: string[];
}

/**
 * 向量化任务（用于知识库语义搜索）
 */
export interface VectorizationTaskPayload {
  project_id: string;
  entry_ids?: string[];
  model: string;
  batch_size?: number;
}

export interface VectorizationTaskResult {
  total_processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

/**
 * 批量操作任务
 */
export interface BatchOperationTaskPayload<T = any> {
  operations: Array<{
    type: string;
    target_id: string;
    data: T;
  }>;
  stop_on_error?: boolean;
  parallel?: boolean;
}

export interface BatchOperationTaskResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ target_id: string; error: string }>;
}

// ============================================================================
// 任务调度接口
// ============================================================================

/**
 * 定时任务定义
 */
export interface ScheduledTask {
  id: string;
  name: string;
  type: string;
  payload: any;
  cron_expression: string;
  timezone?: string;
  enabled: boolean;
  last_run?: Date;
  next_run?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * 任务调度器接口
 */
export interface ITaskScheduler {
  /**
   * 创建定时任务
   */
  schedule(
    name: string,
    type: string,
    payload: any,
    cronExpression: string,
    timezone?: string
  ): Promise<ScheduledTask>;

  /**
   * 更新定时任务
   */
  updateSchedule(
    scheduleId: string,
    updates: Partial<Pick<ScheduledTask, 'cron_expression' | 'timezone' | 'enabled'>>
  ): Promise<ScheduledTask>;

  /**
   * 删除定时任务
   */
  unschedule(scheduleId: string): Promise<void>;

  /**
   * 获取定时任务
   */
  getSchedule(scheduleId: string): Promise<ScheduledTask | null>;

  /**
   * 获取所有定时任务
   */
  getAllSchedules(): Promise<ScheduledTask[]>;

  /**
   * 启用定时任务
   */
  enable(scheduleId: string): Promise<void>;

  /**
   * 禁用定时任务
   */
  disable(scheduleId: string): Promise<void>;

  /**
   * 手动触发定时任务
   */
  trigger(scheduleId: string): Promise<string>;

  /**
   * 启动调度器
   */
  start(): Promise<void>;

  /**
   * 停止调度器
   */
  stop(): Promise<void>;
}

// ============================================================================
// 任务事件接口
// ============================================================================

/**
 * 任务事件类型
 */
export type TaskEventType =
  | 'task_added'
  | 'task_started'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'task_cancelled'
  | 'task_retrying';

/**
 * 任务事件
 */
export interface TaskEvent {
  type: TaskEventType;
  task: TaskDefinition;
  timestamp: Date;
  data?: any;
}

/**
 * 任务事件监听器
 */
export type TaskEventListener = (event: TaskEvent) => void | Promise<void>;

/**
 * 支持事件的任务队列接口
 */
export interface IEventedTaskQueue extends ITaskQueue {
  /**
   * 添加事件监听器
   */
  addEventListener(type: TaskEventType, listener: TaskEventListener): void;

  /**
   * 移除事件监听器
   */
  removeEventListener(type: TaskEventType, listener: TaskEventListener): void;

  /**
   * 移除所有监听器
   */
  removeAllEventListeners(type?: TaskEventType): void;
}

// ============================================================================
// 任务队列工厂接口
// ============================================================================

/**
 * 任务队列工厂
 */
export interface ITaskQueueFactory {
  /**
   * 创建任务队列
   */
  createQueue(config: TaskQueueConfig): ITaskQueue;

  /**
   * 创建任务调度器
   */
  createScheduler(queue: ITaskQueue): ITaskScheduler;

  /**
   * 获取默认配置
   */
  getDefaultConfig(type: TaskQueueType): TaskQueueConfig;

  /**
   * 验证配置
   */
  validateConfig(config: TaskQueueConfig): Promise<{ valid: boolean; errors?: string[] }>;
}

// ============================================================================
// 优先级队列接口
// ============================================================================

/**
 * 优先级队列接口
 */
export interface IPriorityTaskQueue extends ITaskQueue {
  /**
   * 获取下一个最高优先级任务
   */
  getNextTask(): Promise<TaskDefinition | null>;

  /**
   * 获取指定优先级的任务数量
   */
  getCountByPriority(priority: TaskPriority): Promise<number>;

  /**
   * 调整任务优先级
   */
  adjustPriority(taskId: string, priority: TaskPriority): Promise<void>;
}

// ============================================================================
// 延迟队列接口
// ============================================================================

/**
 * 延迟队列接口
 */
export interface IDelayedTaskQueue extends ITaskQueue {
  /**
   * 添加延迟任务
   */
  addDelayed<T = any>(
    type: string,
    payload: T,
    delayMs: number,
    options?: TaskOptions
  ): Promise<string>;

  /**
   * 添加定时任务
   */
  addScheduled<T = any>(
    type: string,
    payload: T,
    executeAt: Date,
    options?: TaskOptions
  ): Promise<string>;

  /**
   * 获取延迟任务
   */
  getDelayedTasks(): Promise<TaskDefinition[]>;

  /**
   * 获取即将执行的任务
   */
  getUpcomingTasks(withinMs?: number): Promise<TaskDefinition[]>;
}
