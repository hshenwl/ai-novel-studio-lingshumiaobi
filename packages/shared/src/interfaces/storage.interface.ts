/**
 * StorageProvider接口 - 文件存储抽象层
 * 支持本地文件系统和对象存储（S3、OSS等）切换
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 存储提供者类型
 */
export type StorageProviderType = 'local' | 's3' | 'oss' | 'cos' | 'minio' | 'azure-blob';

/**
 * 存储配置
 */
export interface StorageConfig {
  type: StorageProviderType;
  base_path: string;

  // 本地存储配置
  local?: {
    root_dir: string;
    temp_dir?: string;
    max_file_size?: number;
  };

  // S3兼容存储配置
  s3?: {
    endpoint?: string;
    region: string;
    bucket: string;
    access_key_id: string;
    secret_access_key: string;
    session_token?: string;
    force_path_style?: boolean;
    ssl_enabled?: boolean;
  };

  // Azure Blob存储配置
  azure?: {
    connection_string: string;
    container: string;
  };

  // 通用配置
  max_file_size?: number;
  allowed_extensions?: string[];
  enable_encryption?: boolean;
  encryption_key?: string;
}

/**
 * 文件元数据
 */
export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  extension: string;
  checksum: string;
  created_at: Date;
  updated_at: Date;
  tags?: Record<string, string>;
  custom_metadata?: Record<string, any>;
}

/**
 * 文件上传选项
 */
export interface UploadOptions {
  overwrite?: boolean;
  content_type?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  on_progress?: (progress: UploadProgress) => void;
  chunk_size?: number;
}

/**
 * 上传进度
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * 文件下载选项
 */
export interface DownloadOptions {
  range?: { start: number; end: number };
  on_progress?: (progress: DownloadProgress) => void;
}

/**
 * 下载进度
 */
export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * 文件列表选项
 */
export interface ListOptions {
  prefix?: string;
  delimiter?: string;
  max_keys?: number;
  continuation_token?: string;
  include_metadata?: boolean;
}

/**
 * 文件列表结果
 */
export interface ListResult {
  files: FileMetadata[];
  directories: string[];
  is_truncated: boolean;
  continuation_token?: string;
}

/**
 * 文件操作结果
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  error?: Error;
}

/**
 * 复制/移动选项
 */
export interface CopyMoveOptions {
  overwrite?: boolean;
  preserve_metadata?: boolean;
}

/**
 * 签名URL选项
 */
export interface SignedUrlOptions {
  expires_in: number; // 秒
  operation: 'read' | 'write' | 'delete';
  content_type?: string;
}

// ============================================================================
// 核心StorageProvider接口
// ============================================================================

/**
 * 存储提供者接口
 */
export interface IStorageProvider {
  /**
   * 初始化存储提供者
   */
  initialize(config: StorageConfig): Promise<void>;

  /**
   * 关闭存储提供者
   */
  close(): Promise<void>;

  /**
   * 获取存储类型
   */
  getType(): StorageProviderType;

  /**
   * 检查存储是否可用
   */
  isAvailable(): Promise<boolean>;

  // ============================================================================
  // 文件操作
  // ============================================================================

  /**
   * 上传文件（从Buffer）
   */
  upload(
    path: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<FileMetadata>;

  /**
   * 上传文件（从文件路径）
   */
  uploadFromPath(
    storagePath: string,
    localPath: string,
    options?: UploadOptions
  ): Promise<FileMetadata>;

  /**
   * 上传文件（从流）
   */
  uploadFromStream(
    path: string,
    stream: NodeJS.ReadableStream,
    options?: UploadOptions
  ): Promise<FileMetadata>;

  /**
   * 下载文件（返回Buffer）
   */
  download(path: string, options?: DownloadOptions): Promise<Buffer>;

  /**
   * 下载文件到本地路径
   */
  downloadToPath(
    storagePath: string,
    localPath: string,
    options?: DownloadOptions
  ): Promise<void>;

  /**
   * 下载文件（返回流）
   */
  downloadAsStream(path: string, options?: DownloadOptions): Promise<NodeJS.ReadableStream>;

  /**
   * 删除文件
   */
  delete(path: string): Promise<OperationResult>;

  /**
   * 批量删除文件
   */
  deleteMany(paths: string[]): Promise<OperationResult[]>;

  /**
   * 检查文件是否存在
   */
  exists(path: string): Promise<boolean>;

  /**
   * 获取文件元数据
   */
  getMetadata(path: string): Promise<FileMetadata>;

  /**
   * 更新文件元数据
   */
  updateMetadata(
    path: string,
    metadata: Partial<FileMetadata>
  ): Promise<FileMetadata>;

  /**
   * 复制文件
   */
  copy(
    sourcePath: string,
    destinationPath: string,
    options?: CopyMoveOptions
  ): Promise<FileMetadata>;

  /**
   * 移动文件
   */
  move(
    sourcePath: string,
    destinationPath: string,
    options?: CopyMoveOptions
  ): Promise<FileMetadata>;

  /**
   * 重命名文件
   */
  rename(
    path: string,
    newName: string
  ): Promise<FileMetadata>;

  // ============================================================================
  // 目录操作
  // ============================================================================

  /**
   * 列出文件和目录
   */
  list(path?: string, options?: ListOptions): Promise<ListResult>;

  /**
   * 创建目录
   */
  createDirectory(path: string): Promise<OperationResult>;

  /**
   * 删除目录
   */
  deleteDirectory(path: string, recursive?: boolean): Promise<OperationResult>;

  /**
   * 检查目录是否存在
   */
  directoryExists(path: string): Promise<boolean>;

  /**
   * 获取目录大小
   */
  getDirectorySize(path: string): Promise<number>;

  // ============================================================================
  // 高级功能
  // ============================================================================

  /**
   * 生成签名URL（用于临时访问）
   */
  getSignedUrl(path: string, options: SignedUrlOptions): Promise<string>;

  /**
   * 计算文件校验和
   */
  calculateChecksum(path: string, algorithm?: 'md5' | 'sha256'): Promise<string>;

  /**
   * 搜索文件
   */
  search(
    query: string,
    options?: { tags?: Record<string, string>; max_results?: number }
  ): Promise<FileMetadata[]>;

  /**
   * 获取存储统计信息
   */
  getStorageStats(): Promise<StorageStats>;

  /**
   * 执行存储健康检查
   */
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  total_files: number;
  total_size: number;
  total_directories: number;
  by_extension?: Record<string, { count: number; size: number }>;
  by_mime_type?: Record<string, { count: number; size: number }>;
}

// ============================================================================
// 特化存储接口
// ============================================================================

/**
 * 项目文件存储接口 - 管理项目相关文件
 */
export interface IProjectStorage {
  /**
   * 初始化项目存储空间
   */
  initializeProject(projectId: string): Promise<void>;

  /**
   * 保存章节内容
   */
  saveChapterContent(
    projectId: string,
    chapterId: string,
    content: Buffer,
    format?: 'txt' | 'md' | 'html'
  ): Promise<FileMetadata>;

  /**
   * 读取章节内容
   */
  readChapterContent(
    projectId: string,
    chapterId: string,
    format?: 'txt' | 'md' | 'html'
  ): Promise<Buffer>;

  /**
   * 保存项目设置
   */
  saveProjectSettings(
    projectId: string,
    settings: any
  ): Promise<FileMetadata>;

  /**
   * 读取项目设置
   */
  readProjectSettings(projectId: string): Promise<any>;

  /**
   * 保存导出文件
   */
  saveExportFile(
    projectId: string,
    exportType: string,
    data: Buffer,
    filename: string
  ): Promise<FileMetadata>;

  /**
   * 列出项目导出文件
   */
  listExportFiles(projectId: string): Promise<FileMetadata[]>;

  /**
   * 保存备份
   */
  saveBackup(
    projectId: string,
    data: Buffer,
    description?: string
  ): Promise<FileMetadata>;

  /**
   * 列出项目备份
   */
  listBackups(projectId: string): Promise<Array<FileMetadata & { description?: string }>>;

  /**
   * 恢复备份
   */
  restoreBackup(projectId: string, backupId: string): Promise<Buffer>;

  /**
   * 清理项目文件
   */
  cleanupProject(projectId: string): Promise<void>;

  /**
   * 获取项目存储统计
   */
  getProjectStats(projectId: string): Promise<ProjectStorageStats>;
}

export interface ProjectStorageStats {
  total_size: number;
  chapters_size: number;
  exports_size: number;
  backups_size: number;
  file_count: number;
}

/**
 * 媒体存储接口 - 管理图片、音频等媒体文件
 */
export interface IMediaStorage {
  /**
   * 上传图片
   */
  uploadImage(
    path: string,
    data: Buffer,
    options?: UploadOptions & { optimize?: boolean; max_width?: number; max_height?: number }
  ): Promise<FileMetadata & { thumbnail?: FileMetadata }>;

  /**
   * 生成缩略图
   */
  generateThumbnail(
    path: string,
    size: { width: number; height: number }
  ): Promise<FileMetadata>;

  /**
   * 获取图片元数据（包括EXIF等）
   */
  getImageMetadata(path: string): Promise<ImageMetadata>;

  /**
   * 上传音频
   */
  uploadAudio(
    path: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<FileMetadata>;

  /**
   * 获取音频元数据（包括时长、比特率等）
   */
  getAudioMetadata(path: string): Promise<AudioMetadata>;
}

export interface ImageMetadata extends FileMetadata {
  width: number;
  height: number;
  format: string;
  color_depth: number;
  has_alpha: boolean;
  exif?: Record<string, any>;
}

export interface AudioMetadata extends FileMetadata {
  duration: number;
  sample_rate: number;
  channels: number;
  bit_rate: number;
  format: string;
}

/**
 * 临时存储接口 - 管理临时文件
 */
export interface ITempStorage {
  /**
   * 创建临时文件
   */
  createTempFile(
    extension?: string,
    prefix?: string
  ): Promise<{ path: string; cleanup: () => Promise<void> }>;

  /**
   * 创建临时目录
   */
  createTempDirectory(prefix?: string): Promise<{ path: string; cleanup: () => Promise<void> }>;

  /**
   * 清理过期临时文件
   */
  cleanupExpired(maxAgeMs?: number): Promise<number>;

  /**
   * 清理所有临时文件
   */
  cleanupAll(): Promise<void>;
}

// ============================================================================
// 存储提供者工厂接口
// ============================================================================

/**
 * 存储提供者工厂
 */
export interface IStorageProviderFactory {
  /**
   * 创建存储提供者
   */
  createProvider(config: StorageConfig): IStorageProvider;

  /**
   * 创建项目存储
   */
  createProjectStorage(config: StorageConfig): IProjectStorage;

  /**
   * 创建媒体存储
   */
  createMediaStorage(config: StorageConfig): IMediaStorage;

  /**
   * 创建临时存储
   */
  createTempStorage(config: StorageConfig): ITempStorage;

  /**
   * 获取默认配置
   */
  getDefaultConfig(type: StorageProviderType): StorageConfig;

  /**
   * 验证配置
   */
  validateConfig(config: StorageConfig): Promise<{ valid: boolean; errors?: string[] }>;
}

// ============================================================================
// 存储事件接口
// ============================================================================

/**
 * 存储事件类型
 */
export type StorageEventType =
  | 'file_uploaded'
  | 'file_downloaded'
  | 'file_deleted'
  | 'file_moved'
  | 'file_copied'
  | 'directory_created'
  | 'directory_deleted';

/**
 * 存储事件
 */
export interface StorageEvent {
  type: StorageEventType;
  path: string;
  metadata?: FileMetadata;
  timestamp: Date;
  error?: Error;
}

/**
 * 存储事件监听器
 */
export type StorageEventListener = (event: StorageEvent) => void | Promise<void>;

/**
 * 支持事件的存储提供者接口
 */
export interface IEventedStorageProvider extends IStorageProvider {
  /**
   * 添加事件监听器
   */
  addEventListener(type: StorageEventType, listener: StorageEventListener): void;

  /**
   * 移除事件监听器
   */
  removeEventListener(type: StorageEventType, listener: StorageEventListener): void;

  /**
   * 移除所有监听器
   */
  removeAllEventListeners(type?: StorageEventType): void;
}
