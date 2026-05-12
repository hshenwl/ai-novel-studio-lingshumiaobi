/**
 * AuthProvider接口 - 用户认证抽象层
 * 支持本地账号和云端认证（JWT、OAuth2等）切换
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 认证提供者类型
 */
export type AuthProviderType =
  | 'local'      // 本地账号
  | 'jwt'        // JWT令牌
  | 'oauth2'     // OAuth2
  | 'oidc'       // OpenID Connect
  | 'ldap'       // LDAP
  | 'saml';      // SAML

/**
 * 认证配置
 */
export interface AuthConfig {
  type: AuthProviderType;
  session_timeout: number;
  max_login_attempts: number;
  lockout_duration: number;

  // 本地认证配置
  local?: {
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    password_require_numbers: boolean;
    password_require_symbols: boolean;
    password_hash_algorithm: 'bcrypt' | 'argon2' | 'pbkdf2';
    password_hash_cost: number;
  };

  // JWT配置
  jwt?: {
    secret: string;
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    access_token_expiry: number;
    refresh_token_expiry: number;
    issuer?: string;
    audience?: string;
  };

  // OAuth2配置
  oauth2?: {
    authorization_url: string;
    token_url: string;
    userinfo_url?: string;
    client_id: string;
    client_secret: string;
    scopes: string[];
    redirect_uri: string;
    pkce?: boolean;
  };

  // OIDC配置
  oidc?: {
    issuer: string;
    client_id: string;
    client_secret: string;
    scopes: string[];
    redirect_uri: string;
  };

  // LDAP配置
  ldap?: {
    url: string;
    base_dn: string;
    bind_dn?: string;
    bind_password?: string;
    search_filter: string;
    attributes?: string[];
    tls?: boolean;
  };

  // SAML配置
  saml?: {
    entry_point: string;
    issuer: string;
    callback_url: string;
    cert: string;
    private_key?: string;
  };
}

/**
 * 用户实体
 */
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  email_verified: boolean;
  roles: string[];
  permissions: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

/**
 * 用户凭证
 */
export interface UserCredentials {
  type: 'password' | 'token' | 'oauth' | 'api_key';
  identifier: string;
  secret: string;
  provider?: string;
  code?: string;
}

/**
 * 认证结果
 */
export interface AuthenticationResult {
  success: boolean;
  user?: User;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: AuthError;
}

/**
 * 认证错误
 */
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * 会话信息
 */
export interface Session {
  id: string;
  user_id: string;
  tenant_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  created_at: Date;
  last_activity_at: Date;
  ip_address?: string;
  user_agent?: string;
  device_info?: DeviceInfo;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  device_id?: string;
  device_name?: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'other';
  os?: string;
  browser?: string;
}

/**
 * 权限定义
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, any>;
}

/**
 * 角色定义
 */
export interface Role {
  id: string;
  tenant_id?: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * 注册选项
 */
export interface RegisterOptions {
  email_verified?: boolean;
  roles?: string[];
  metadata?: Record<string, any>;
  skip_email_verification?: boolean;
  invite_token?: string;
}

/**
 * 登录选项
 */
export interface LoginOptions {
  remember_me?: boolean;
  device_info?: DeviceInfo;
  mfa_code?: string;
}

/**
 * 密码重置选项
 */
export interface PasswordResetOptions {
  redirect_url?: string;
  expiry_hours?: number;
}

/**
 * 令牌验证结果
 */
export interface TokenValidationResult {
  valid: boolean;
  user?: User;
  session?: Session;
  error?: AuthError;
}

/**
 * 令牌刷新结果
 */
export interface TokenRefreshResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: AuthError;
}

/**
 * 用户查询选项
 */
export interface UserQueryOptions {
  tenant_id?: string;
  status?: User['status'];
  roles?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// 核心AuthProvider接口
// ============================================================================

/**
 * 认证提供者接口
 */
export interface IAuthProvider {
  /**
   * 初始化认证提供者
   */
  initialize(config: AuthConfig): Promise<void>;

  /**
   * 关闭认证提供者
   */
  close(): Promise<void>;

  /**
   * 获取认证类型
   */
  getType(): AuthProviderType;

  /**
   * 检查认证服务是否可用
   */
  isAvailable(): Promise<boolean>;

  // ============================================================================
  // 用户注册与认证
  // ============================================================================

  /**
   * 用户注册
   */
  register(
    credentials: UserCredentials,
    options?: RegisterOptions
  ): Promise<AuthenticationResult>;

  /**
   * 用户登录
   */
  login(
    credentials: UserCredentials,
    options?: LoginOptions
  ): Promise<AuthenticationResult>;

  /**
   * 用户登出
   */
  logout(sessionId: string): Promise<void>;

  /**
   * 登出所有设备
   */
  logoutAll(userId: string): Promise<void>;

  /**
   * 验证令牌
   */
  validateToken(token: string): Promise<TokenValidationResult>;

  /**
   * 刷新令牌
   */
  refreshToken(refreshToken: string): Promise<TokenRefreshResult>;

  /**
   * 撤销令牌
   */
  revokeToken(token: string): Promise<void>;

  // ============================================================================
  // 用户管理
  // ============================================================================

  /**
   * 获取用户
   */
  getUser(userId: string): Promise<User | null>;

  /**
   * 根据邮箱获取用户
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * 根据用户名获取用户
   */
  getUserByUsername(username: string): Promise<User | null>;

  /**
   * 查询用户
   */
  queryUsers(options: UserQueryOptions): Promise<User[]>;

  /**
   * 更新用户
   */
  updateUser(userId: string, updates: Partial<User>): Promise<User>;

  /**
   * 删除用户
   */
  deleteUser(userId: string): Promise<void>;

  /**
   * 检查用户是否存在
   */
  userExists(identifier: string): Promise<boolean>;

  // ============================================================================
  // 密码管理
  // ============================================================================

  /**
   * 修改密码
   */
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void>;

  /**
   * 重置密码（发送重置邮件）
   */
  requestPasswordReset(email: string, options?: PasswordResetOptions): Promise<void>;

  /**
   * 确认重置密码
   */
  confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<void>;

  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string): Promise<PasswordStrengthResult>;

  // ============================================================================
  // 会话管理
  // ============================================================================

  /**
   * 获取用户会话
   */
  getSession(sessionId: string): Promise<Session | null>;

  /**
   * 获取用户所有会话
   */
  getUserSessions(userId: string): Promise<Session[]>;

  /**
   * 更新会话活动时间
   */
  updateSessionActivity(sessionId: string): Promise<void>;

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): Promise<number>;

  // ============================================================================
  // 角色与权限
  // ============================================================================

  /**
   * 获取角色
   */
  getRole(roleId: string): Promise<Role | null>;

  /**
   * 根据名称获取角色
   */
  getRoleByName(name: string, tenantId?: string): Promise<Role | null>;

  /**
   * 获取所有角色
   */
  getAllRoles(tenantId?: string): Promise<Role[]>;

  /**
   * 创建角色
   */
  createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role>;

  /**
   * 更新角色
   */
  updateRole(roleId: string, updates: Partial<Role>): Promise<Role>;

  /**
   * 删除角色
   */
  deleteRole(roleId: string): Promise<void>;

  /**
   * 为用户分配角色
   */
  assignRole(userId: string, roleId: string): Promise<void>;

  /**
   * 移除用户角色
   */
  removeRole(userId: string, roleId: string): Promise<void>;

  /**
   * 获取用户权限
   */
  getUserPermissions(userId: string): Promise<string[]>;

  /**
   * 检查用户权限
   */
  hasPermission(userId: string, permission: string): Promise<boolean>;

  /**
   * 检查用户角色
   */
  hasRole(userId: string, role: string): Promise<boolean>;

  // ============================================================================
  // 邮箱验证
  // ============================================================================

  /**
   * 发送邮箱验证
   */
  sendEmailVerification(userId: string): Promise<void>;

  /**
   * 验证邮箱
   */
  verifyEmail(token: string): Promise<void>;

  /**
   * 检查邮箱是否已验证
   */
  isEmailVerified(userId: string): Promise<boolean>;

  // ============================================================================
  // 多租户支持
  // ============================================================================

  /**
   * 获取租户用户列表
   */
  getTenantUsers(tenantId: string): Promise<User[]>;

  /**
   * 邀请用户加入租户
   */
  inviteUser(
    tenantId: string,
    email: string,
    roles?: string[]
  ): Promise<string>;

  /**
   * 接受邀请
   */
  acceptInvitation(token: string): Promise<AuthenticationResult>;

  /**
   * 移除租户用户
   */
  removeTenantUser(tenantId: string, userId: string): Promise<void>;

  // ============================================================================
  // 审计与监控
  // ============================================================================

  /**
   * 获取认证日志
   */
  getAuthLogs(options?: {
    user_id?: string;
    tenant_id?: string;
    action?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
  }): Promise<AuthLog[]>;

  /**
   * 记录认证事件
   */
  logAuthEvent(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}

/**
 * 密码强度结果
 */
export interface PasswordStrengthResult {
  valid: boolean;
  score: number;
  warnings: string[];
  suggestions: string[];
}

/**
 * 认证日志
 */
export interface AuthLog {
  id: string;
  user_id: string;
  tenant_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

// ============================================================================
// 特化认证接口
// ============================================================================

/**
 * OAuth2认证接口
 */
export interface IOAuth2AuthProvider extends IAuthProvider {
  /**
   * 获取授权URL
   */
  getAuthorizationUrl(state?: string, codeChallenge?: string): Promise<string>;

  /**
   * 通过授权码交换令牌
   */
  exchangeCodeForToken(code: string, codeVerifier?: string): Promise<AuthenticationResult>;

  /**
   * 获取用户信息
   */
  getUserInfo(accessToken: string): Promise<User>;
}

/**
 * 多因素认证接口
 */
export interface IMFAAuthProvider extends IAuthProvider {
  /**
   * 启用MFA
   */
  enableMFA(userId: string): Promise<MFASetupResult>;

  /**
   * 禁用MFA
   */
  disableMFA(userId: string, code: string): Promise<void>;

  /**
   * 验证MFA代码
   */
  verifyMFA(userId: string, code: string): Promise<boolean>;

  /**
   * 生成恢复代码
   */
  generateRecoveryCodes(userId: string): Promise<string[]>;
}

/**
 * MFA设置结果
 */
export interface MFASetupResult {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}

/**
 * API密钥认证接口
 */
export interface IApiKeyAuthProvider extends IAuthProvider {
  /**
   * 创建API密钥
   */
  createApiKey(userId: string, name: string, scopes?: string[]): Promise<ApiKey>;

  /**
   * 获取用户的API密钥
   */
  getApiKeys(userId: string): Promise<ApiKey[]>;

  /**
   * 撤销API密钥
   */
  revokeApiKey(keyId: string): Promise<void>;

  /**
   * 验证API密钥
   */
  validateApiKey(key: string): Promise<TokenValidationResult>;
}

/**
 * API密钥
 */
export interface ApiKey {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  expires_at?: Date;
  last_used_at?: Date;
  created_at: Date;
}

// ============================================================================
// 认证提供者工厂接口
// ============================================================================

/**
 * 认证提供者工厂
 */
export interface IAuthProviderFactory {
  /**
   * 创建认证提供者
   */
  createProvider(config: AuthConfig): IAuthProvider;

  /**
   * 创建OAuth2认证提供者
   */
  createOAuth2Provider(config: AuthConfig): IOAuth2AuthProvider;

  /**
   * 创建MFA认证提供者
   */
  createMFAProvider(config: AuthConfig): IMFAAuthProvider;

  /**
   * 创建API密钥认证提供者
   */
  createApiKeyProvider(config: AuthConfig): IApiKeyAuthProvider;

  /**
   * 获取默认配置
   */
  getDefaultConfig(type: AuthProviderType): AuthConfig;

  /**
   * 验证配置
   */
  validateConfig(config: AuthConfig): Promise<{ valid: boolean; errors?: string[] }>;
}

// ============================================================================
// 认证中间件接口
// ============================================================================

/**
 * 认证中间件上下文
 */
export interface AuthMiddlewareContext {
  request: any;
  response: any;
  user?: User;
  session?: Session;
  token?: string;
}

/**
 * 认证中间件
 */
export interface IAuthMiddleware {
  /**
   * 处理请求
   */
  handle(context: AuthMiddlewareContext): Promise<void>;

  /**
   * 检查是否已认证
   */
  isAuthenticated(context: AuthMiddlewareContext): boolean;

  /**
   * 检查权限
   */
  hasPermission(context: AuthMiddlewareContext, permission: string): Promise<boolean>;

  /**
   * 检查角色
   */
  hasRole(context: AuthMiddlewareContext, role: string): Promise<boolean>;
}

// ============================================================================
// 认证事件接口
// ============================================================================

/**
 * 认证事件类型
 */
export type AuthEventType =
  | 'user_registered'
  | 'user_login'
  | 'user_logout'
  | 'token_refreshed'
  | 'token_revoked'
  | 'password_changed'
  | 'password_reset'
  | 'email_verified'
  | 'role_assigned'
  | 'role_removed'
  | 'mfa_enabled'
  | 'mfa_disabled';

/**
 * 认证事件
 */
export interface AuthEvent {
  type: AuthEventType;
  user: User;
  session?: Session;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * 认证事件监听器
 */
export type AuthEventListener = (event: AuthEvent) => void | Promise<void>;

/**
 * 支持事件的认证提供者接口
 */
export interface IEventedAuthProvider extends IAuthProvider {
  /**
   * 添加事件监听器
   */
  addEventListener(type: AuthEventType, listener: AuthEventListener): void;

  /**
   * 移除事件监听器
   */
  removeEventListener(type: AuthEventType, listener: AuthEventListener): void;

  /**
   * 移除所有监听器
   */
  removeAllEventListeners(type?: AuthEventType): void;
}
