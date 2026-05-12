/**
 * 接口统一导出
 * "本地优先、云端兼容"架构的核心抽象接口定义
 */

// Repository接口 - 数据库访问抽象
export * from './repository.interface';

// StorageProvider接口 - 文件存储抽象
export * from './storage.interface';

// TaskQueue接口 - 任务队列抽象
export * from './task-queue.interface';

// AuthProvider接口 - 用户认证抽象
export * from './auth.interface';

// AIModelProvider接口 - AI模型网关抽象
export * from './ai-model.interface';

// ============================================================================
// 核心设计原则总结
// ============================================================================

/**
 * 本系统遵循以下核心设计原则：
 *
 * 1. **依赖倒置原则 (DIP)**
 *    - 高层业务模块依赖抽象接口，不依赖具体实现
 *    - 具体实现（SQLite、PostgreSQL、Redis等）依赖抽象接口
 *
 * 2. **接口隔离原则 (ISP)**
 *    - 每个接口专注于单一职责
 *    - 特化接口继承基础接口，提供额外能力
 *
 * 3. **配置驱动**
 *    - 所有实现通过配置切换，业务代码无感知
 *    - 支持local/cloud模式无缝切换
 *
 * 4. **多租户支持**
 *    - 所有数据库实体包含tenant_id和user_id字段
 *    - Repository查询自动隔离租户数据
 *
 * 5. **可扩展性**
 *    - 支持事件监听机制，便于监控和审计
 *    - 支持中间件和拦截器，便于扩展功能
 *
 * 6. **错误处理**
 *    - 所有操作返回明确的错误信息
 *    - 支持重试机制和错误恢复
 *
 * 7. **性能优化**
 *    - 支持缓存机制
 *    - 支持批量操作
 *    - 支持流式处理
 *
 * 8. **安全性**
 *    - 认证接口支持多种认证方式
 *    - 支持权限控制和角色管理
 *    - 支持审计日志
 */

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 示例：配置切换实现
 *
 * // 本地模式配置
 * const localConfig = {
 *   repository: { type: 'sqlite', path: './data/db.sqlite' },
 *   storage: { type: 'local', base_path: './data/files' },
 *   taskQueue: { type: 'sqlite', database_path: './data/queue.sqlite' },
 *   auth: { type: 'local', ... },
 *   aiModel: { provider: 'openai', api_key: '...', ... }
 * };
 *
 * // 云端模式配置
 * const cloudConfig = {
 *   repository: { type: 'postgresql', host: 'db.example.com', ... },
 *   storage: { type: 's3', bucket: 'novel-files', ... },
 *   taskQueue: { type: 'redis', host: 'redis.example.com', ... },
 *   auth: { type: 'jwt', secret: '...', ... },
 *   aiModel: { provider: 'anthropic', api_key: '...', ... }
 * };
 *
 * // 业务代码无需关心具体实现
 * const projectRepo = repositoryFactory.createProjectRepository(config.repository);
 * const storage = storageFactory.createProjectStorage(config.storage);
 * const taskQueue = taskQueueFactory.createQueue(config.taskQueue);
 * const authProvider = authFactory.createProvider(config.auth);
 * const aiProvider = aiModelFactory.createProvider(config.aiModel);
 */

// ============================================================================
// 接口版本管理
// ============================================================================

/**
 * 接口版本: 1.0.0
 *
 * 未来版本可能添加的功能：
 * - WebSocket实时通信抽象
 * - 日志服务抽象
 * - 监控服务抽象
 * - 配置服务抽象
 * - 国际化服务抽象
 */