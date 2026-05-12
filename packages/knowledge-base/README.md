# @ai-novel/knowledge-base

AI小说创作系统 - 知识库管理模块

## 功能特性

- **多来源支持**: 本地SQLite(FTS5) + 云端API(预留)
- **全文检索**: 基于SQLite FTS5的高性能全文搜索
- **向量检索**: 云端向量嵌入支持(预留接口)
- **场景推荐**: 根据创作场景自动推荐相关知识库内容
- **约束管理**: 自动生成和管理约束清单
- **引用追踪**: 记录知识库引用历史
- **版本管理**: 知识库版本控制和回滚

## 安装

```bash
npm install @ai-novel/knowledge-base
```

## 快速开始

### 初始化知识库

```typescript
import { getKnowledgeBase, KnowledgeSource } from '@ai-novel/knowledge-base';

const kb = await getKnowledgeBase({
  tenantId: 'default',
  source: KnowledgeSource.LOCAL,
  local: {
    enableFTS: true,
    knowledgeDir: './knowledge'  // 知识库文件目录
  }
});
```

### 从文件导入

```typescript
import { importKnowledge } from '@ai-novel/knowledge-base';

const result = await importKnowledge(kb, {
  knowledgeDir: './knowledge',
  tenantId: 'default',
  userId: 'user-001',
  batchSize: 50
});

console.log(`导入完成: ${result.imported}/${result.total}`);
```

### 搜索知识库

```typescript
const results = await kb.search({
  tenantId: 'default',
  userId: 'user-001',
  query: '如何写好伏笔',
  categories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES],
  mode: SearchMode.FTS,
  limit: 10
});

results.entries.forEach(entry => {
  console.log(`${entry.title} (得分: ${entry.score})`);
});
```

### 场景推荐

```typescript
// 生成约束清单
const constraints = await kb.generateConstraints(
  'novel-001',
  CreationScene.CONTENT_GENERATION,
  'default',
  'user-001'
);

console.log(`生成 ${constraints.constraints.length} 条约束`);
constraints.constraints.forEach(c => {
  console.log(`[${c.priority}] ${c.title}`);
});
```

## 知识库调用规则

知识库系统遵循以下强制约束规则:

1. **Planner**: 根据当前创作场景自动读取对应知识库
2. **约束清单**: 读取内容写入约束清单
3. **Writer**: 生成内容时必须遵守约束清单
4. **Auditor**: 检查是否违反知识库设定
5. **Reviser**: 修订时不得破坏知识库约束
6. **Settler**: 保存知识库引用记录

## 场景推荐策略

| 创作场景 | 推荐分类 | 约束类型 |
|---------|---------|---------|
| 世界设定 | world/, reference/ | 设定约束 |
| 卷纲生成 | techniques/, plots/, world/ | 剧情+设定约束 |
| 章纲生成 | tutorials/, techniques/, plots/ | 剧情+技法约束 |
| 正文生成 | scenes/, characters/, tutorials/ | 人物+风格约束 |
| 人物塑造 | characters/, tutorials/ | 人物约束 |
| 伏笔设计 | tutorials/, techniques/, plots/ | 剧情+技法约束 |
| 爽点设计 | operations/, plots/, reference/ | 商业+剧情约束 |
| AI去味 | tutorials/, characters/, reference/ | 风格+人物约束 |
| 审核 | reference/, tutorials/, techniques/ | 技法+风格约束 |

## 数据库表结构

### knowledge_entries (知识条目)
```sql
CREATE TABLE knowledge_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT,
  status TEXT DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### knowledge_references (引用记录)
```sql
CREATE TABLE knowledge_references (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  context TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### constraint_lists (约束清单)
```sql
CREATE TABLE constraint_lists (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  novel_id TEXT NOT NULL,
  scene TEXT NOT NULL,
  constraints TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);
```

## 本地/云端切换

系统支持本地优先、云端兼容的架构:

```typescript
// 本地模式
const localKb = await getKnowledgeBase({
  tenantId: 'default',
  source: KnowledgeSource.LOCAL,
  local: { enableFTS: true }
});

// 云端模式(预留)
const cloudKb = await getKnowledgeBase({
  tenantId: 'default',
  source: KnowledgeSource.CLOUD,
  cloud: {
    apiEndpoint: 'https://api.example.com',
    apiKey: 'your-api-key',
    enableVector: true
  }
});

// 混合模式(预留)
const hybridKb = await getKnowledgeBase({
  tenantId: 'default',
  source: KnowledgeSource.HYBRID,
  local: { enableFTS: true },
  cloud: { enableVector: true }
});
```

## 多租户支持

所有表都预留了 `tenant_id` 和 `user_id` 字段:

```typescript
// 创建条目时指定租户
await kb.createEntry({
  tenantId: 'company-a',
  userId: 'user-001',
  category: KnowledgeCategory.TUTORIALS,
  title: '写作教程',
  content: '...'
});

// 搜索时自动隔离
const results = await kb.search({
  tenantId: 'company-a',  // 只搜索该租户的数据
  query: '伏笔',
  ...
});
```

## API文档

### IKnowledgeBase 接口

```typescript
interface IKnowledgeBase {
  // 条目管理
  createEntry(entry): Promise<KnowledgeEntry>;
  getEntry(id, tenantId): Promise<KnowledgeEntry | null>;
  updateEntry(id, tenantId, updates): Promise<KnowledgeEntry>;
  deleteEntry(id, tenantId): Promise<boolean>;

  // 检索
  search(request): Promise<SearchResult>;
  vectorSearch?(request): Promise<SearchResult>;
  hybridSearch?(request): Promise<SearchResult>;

  // 约束管理
  generateConstraints(novelId, scene, tenantId, userId): Promise<ConstraintList>;
  updateConstraintStatus(listId, constraintId, tenantId, updates): Promise<void>;

  // 引用管理
  recordReference(reference): Promise<KnowledgeReference>;
  getReferenceHistory(nodeId, tenantId): Promise<KnowledgeReference[]>;

  // 版本管理
  createVersion(tenantId, userId, changes): Promise<KnowledgeVersion>;
  rollbackToVersion(versionId, tenantId): Promise<void>;
}
```

## License

MIT
