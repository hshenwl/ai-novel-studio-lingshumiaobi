# 多租户字段设计说明

## 概述

AI Novel Studio 数据库设计采用**共享数据库、共享Schema**的多租户架构，通过 `tenant_id` 字段实现租户隔离。

## 多租户字段说明

### 核心字段

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| `tenant_id` | String | 租户ID，用于多租户隔离 | 是 |
| `user_id` | String | 用户ID，数据归属用户 | 是 |
| `created_by` | String | 创建者ID | 否 |
| `updated_by` | String | 最后更新者ID | 否 |
| `created_at` | DateTime | 创建时间 | 否 |
| `updated_at` | DateTime | 最后更新时间 | 否 |
| `deleted_at` | DateTime | 软删除时间（NULL表示未删除） | 是 |
| `version` | Int | 乐观锁版本号 | 否 |

### 设计原则

1. **tenant_id**: 所有表都包含此字段，用于实现租户级别的数据隔离
   - 查询时必须携带 `WHERE tenant_id = ? AND deleted_at IS NULL`
   - 索引保证查询性能

2. **user_id**: 标识数据的归属用户
   - 用于权限控制（用户只能访问自己的数据）
   - 区分同一租户下不同用户的数据

3. **created_by / updated_by**: 审计字段
   - 记录操作者信息
   - 支持审计追踪

4. **deleted_at**: 软删除实现
   - `deleted_at IS NULL` 表示记录有效
   - `deleted_at IS NOT NULL` 表示记录已删除
   - 查询时自动过滤已删除数据

5. **version**: 乐观锁
   - 更新时检查版本号
   - 防止并发更新冲突

## 查询模式

### 标准查询模板

```sql
SELECT * FROM table_name
WHERE tenant_id = ?
  AND user_id = ?  -- 可选，用于用户级隔离
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 软删除查询模板

```sql
-- 软删除（实际是更新）
UPDATE table_name
SET deleted_at = CURRENT_TIMESTAMP,
    updated_by = ?,
    version = version + 1
WHERE id = ?
  AND tenant_id = ?
  AND deleted_at IS NULL;

-- 恢复删除
UPDATE table_name
SET deleted_at = NULL,
    updated_by = ?,
    version = version + 1
WHERE id = ?
  AND tenant_id = ?;

-- 永久删除（需谨慎使用）
DELETE FROM table_name
WHERE id = ?
  AND tenant_id = ?;
```

### 乐观锁更新模板

```sql
UPDATE table_name
SET field = ?,
    updated_by = ?,
    updated_at = CURRENT_TIMESTAMP,
    version = version + 1
WHERE id = ?
  AND tenant_id = ?
  AND version = ?;  -- 检查版本号

-- 如果 affected_rows = 0，说明版本冲突
```

## 索引策略

### 核心索引

每个表都创建以下索引：

1. **tenant_id**: 租户隔离查询
2. **deleted_at**: 软删除过滤
3. **业务字段**: 如 `project_id`, `character_id` 等

### 复合索引建议

```sql
-- 租户+项目复合索引（用于项目级查询）
CREATE INDEX idx_table_tenant_project ON table_name(tenant_id, project_id);

-- 租户+用户复合索引（用于用户级查询）
CREATE INDEX idx_table_tenant_user ON table_name(tenant_id, user_id);
```

## 数据隔离级别

### 租户级隔离

```sql
-- 所有数据自动按租户隔离
WHERE tenant_id = ? AND deleted_at IS NULL
```

### 项目级隔离

```sql
-- 数据按项目隔离（租户下的项目）
WHERE tenant_id = ? AND project_id = ? AND deleted_at IS NULL
```

### 用户级隔离

```sql
-- 数据按用户隔离（租户下的用户）
WHERE tenant_id = ? AND user_id = ? AND deleted_at IS NULL
```

## 迁移到 PostgreSQL

### 字段类型映射

| SQLite | PostgreSQL |
|--------|------------|
| TEXT | VARCHAR(255) / TEXT |
| INTEGER | INTEGER / BIGINT |
| DATETIME | TIMESTAMP WITH TIME ZONE |
| BLOB | BYTEA |

### 主要差异处理

1. **布尔类型**
   - SQLite: `INTEGER` (0/1)
   - PostgreSQL: `BOOLEAN`

2. **JSON类型**
   - SQLite: `TEXT` + 应用层解析
   - PostgreSQL: `JSONB` (原生支持，可索引)

3. **UUID**
   - SQLite: `TEXT` (存储UUID字符串)
   - PostgreSQL: `UUID` (原生支持)

4. **数组**
   - SQLite: `TEXT` + JSON数组
   - PostgreSQL: `ARRAY` (原生支持)

### PostgreSQL Schema 修改

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// PostgreSQL 专用字段类型
model Example {
  metadata   Json?    // 原生JSON类型
  enabled    Boolean  @default(true)
  tags       String[] // 原生数组类型
}
```

## 性能优化建议

### 1. 分区表（PostgreSQL）

对于大数据量表（如 chapters），可按租户分区：

```sql
CREATE TABLE chapters (
    -- 字段定义
) PARTITION BY LIST (tenant_id);
```

### 2. 连接池配置

```
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
POOL_SIZE=20
```

### 3. 查询优化

- 避免跨租户 JOIN
- 使用 `SELECT` 指定字段而非 `*`
- 大文本字段（content）延迟加载

## 安全建议

1. **应用层隔离**: 在应用层强制添加 `tenant_id` 过滤
2. **API鉴权**: 所有API请求验证租户归属
3. **SQL注入防护**: 使用参数化查询
4. **敏感数据加密**: 敏感字段应用层加密

## 监控指标

- 租户数据量统计
- 跨租户查询告警
- 软删除数据清理周期
- 版本冲突频率统计
