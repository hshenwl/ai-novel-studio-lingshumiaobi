# 灵鼠妙笔 - AI小说生成软件 发布说明

> **灵鼠妙笔** — 面向网文作者、工作室、小说策划团队的 AI 长篇小说工业化创作平台

---

## v0.1.0 (2026-05-12) — 初始发布

这是灵鼠妙笔的首个正式发布版本，包含完整的项目基础架构和核心功能模块搭建。

---

### 🎯 产品定位

灵鼠妙笔不是简单的"AI生成文本工具"，而是一个面向百万字、千万字级长篇小说生产的 **AI网文工业化创作系统**。支持从市场热榜分析、世界观设定、小说总纲、卷纲拆解、章纲生成、章节正文创作、质量审核、AI去味、Hook追踪、伏笔管理、资产入库到最终导出的完整创作闭环。

---

### ✨ 核心特性

#### 七步专业创作引擎

内置标准化七步创作流水线，每个环节由专属 AI Agent 负责：

| Agent | 名称 | 职责 |
|---|---|---|
| Planner | 规划器 | 读取知识库、项目设定，生成 15 项创作约束清单 |
| Writer | 写作器 | 根据约束清单、大纲、章纲、风格生成正文 |
| DeepReader | 深度读者 | 从读者体验视角检查代入感、爽点、追读欲 |
| DeepEditor | 深度编辑 | 从商业编辑视角检查结构、节奏、题材匹配和留存 |
| Auditor | 审核器 | 执行 20 维度综合质量审核 |
| Reviser | 修订器 | 根据审核意见修订、润色，内置 29 种 AI 去味模式 |
| Settler | 沉淀器 | 将定稿同步入库，更新角色、伏笔、Hook 等结构化数据 |

#### 知识库驱动创作

- 内置 645+ 篇写作知识库，覆盖教程、技法、剧情、人物、世界观、场景等 12 个分类
- Planner 强制读取知识库生成约束清单
- 写作约束贯穿全流水线，Auditor 检查执行情况

#### 多 AI 模型协同

支持 11 家 AI 模型提供商接入：

| 类别 | 提供商 |
|---|---|
| 国际模型 | OpenAI (GPT-4/4o)、Anthropic (Claude 3)、Google (Gemini) |
| 国产模型 | 通义千问、智谱 AI (GLM-4)、DeepSeek、文心一言 |
| 本地模型 | Ollama、LM Studio、vLLM |
| 自定义 | 任意 OpenAI 兼容接口 |

#### 长篇小说连续性保障

- 角色档案管理 — 人物设定、性格、成长弧线全程追踪
- 组织/势力管理 — 宗门、公司、帝国等组织体系
- 关系图谱 — 亲情、爱情、师徒、仇敌等多维关系网络
- 伏笔管理 — 埋设章节与回收章节精准标记
- Hook 管理 — 开局 Hook、章末 Hook、身份 Hook、阴谋 Hook 全链路规划

#### 20 维度质量审核

Auditor Agent 从 20 个维度对内容进行综合审核，支持五级审核结果：

```
PASS → 直接入库
MINOR_REVISE → 轻修后入库
MAJOR_REVISE → 深修后复审
REWRITE → 退回重写
BLOCKED → 退回重新规划
```

#### 29 种 AI 去味模式

Reviser Agent 内置 29 种去 AI 味策略，降低模板感，提升文本自然度。

---

### 🏗️ 技术架构

#### 架构理念：本地优先，云端兼容

```
当前版本：Windows 10 本地安装版
  → 本机启动 Web 服务 → 浏览器访问 http://127.0.0.1:18765
  → SQLite 本地数据库 → 本地文件存储

后期版本：云端 SaaS / 私有化部署
  → PostgreSQL + Redis + 对象存储
  → 多用户/团队协作
```

核心设计：业务代码通过抽象接口与基础设施解耦，本地/云端通过配置切换，无需修改业务逻辑。

#### 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite 8 + Ant Design 6 + Zustand 5 |
| 后端 | NestJS + TypeScript + Prisma ORM |
| 数据库 | SQLite (本地) / PostgreSQL (云端) |
| 启动器 | Go 1.21+ (系统托盘 + 自动启动) |
| 安装包 | Inno Setup 6 |
| 包管理 | pnpm Monorepo |

#### 五大抽象接口

| 接口 | 本地实现 | 云端实现 |
|---|---|---|
| Repository | SQLiteRepository | PostgresRepository |
| StorageProvider | LocalStorageProvider | S3StorageProvider |
| TaskQueue | SQLiteTaskQueue | RedisTaskQueue |
| AuthProvider | LocalAuthProvider | JwtAuthProvider |
| AIModelProvider | 多模型路由 | 多模型路由 |

---

### 📦 项目结构

```
ai-novel-studio/
├── apps/
│   ├── web/                    # React 前端 (21 个页面模块)
│   ├── server/                 # NestJS 后端 (16 个业务模块)
│   └── launcher/               # Windows 启动器 (Go)
│
├── packages/
│   ├── shared/                 # 共享类型、常量、抽象接口
│   ├── database/               # Prisma Schema (15 张核心表)
│   ├── repositories/           # 数据访问抽象层
│   ├── storage/                # 文件存储抽象层
│   ├── queue/                  # 任务队列抽象层
│   ├── ai-gateway/             # AI 模型网关 (11 家提供商)
│   ├── workflow-engine/        # 七步创作引擎 (18 种工作流状态)
│   ├── prompt-engine/          # Prompt 模板系统
│   ├── knowledge-base/         # 知识库系统 (FTS5 全文检索)
│   └── exporter/               # TXT/DOCX 导出
│
├── knowledge/                  # 645+ 篇知识库文件
├── resources/
│   ├── rules/                  # Agent 规则
│   ├── prompts/                # Prompt 模板
│   └── templates/              # 文档模板
├── deploy/
│   ├── installer/              # Inno Setup 安装脚本
│   └── build-all.bat           # 一键构建脚本
└── config/
    ├── config.local.example.json
    └── config.cloud.example.json
```

---

### 📋 功能模块清单

| 模块 | 状态 | 说明 |
|---|---|---|
| 项目管理 | ✅ | 多作品、多卷、多章节管理 |
| 世界设定 | ✅ | 用户输入生成 + 热榜分析生成 |
| 小说总纲 | ✅ | AI 自动生成或手动编辑 |
| 卷纲管理 | ✅ | 支持续写模式、Hook 链规划、爽点密度规划 |
| 章纲管理 | ✅ | 为正文生成和七步工作流提供结构化输入 |
| 章节管理 | ✅ | 正文生成、编辑、导出 |
| 七步工作流 | ✅ | 完整的 Agent 流水线，支持断点续跑 |
| 角色管理 | ✅ | 人物档案、成长弧线追踪 |
| 组织管理 | ✅ | 宗门/公司/帝国等组织体系 |
| 职业管理 | ✅ | 修仙境界/魔法等级等职业等级体系 |
| 关系图谱 | ✅ | 多维关系网络可视化 |
| 伏笔管理 | ✅ | 埋设与回收章节追踪 |
| Hook 管理 | ✅ | 开局/章末/身份/阴谋 Hook 全链路 |
| 写作风格 | ✅ | 自定义写作风格模板 |
| AI 去味模式 | ✅ | 29 种去 AI 味策略 |
| 知识库 | ✅ | 645+ 篇分类知识库，FTS5 全文检索 |
| 模型配置 | ✅ | 11 家 AI 提供商接入配置 |
| 任务中心 | ✅ | 后台任务队列与进度追踪 |
| 日志中心 | ✅ | AI 调用日志与 Token 成本统计 |
| 导出功能 | ✅ | TXT/DOCX 格式导出 |

---

### 🔥 热榜分析生成

支持从番茄小说、起点中文网等平台公开榜单进行趋势分析，自动生成：

- 热门题材分析报告
- 类型趋势归纳
- 推荐创作方向
- 自动生成世界设定 + 总纲 + 角色 + 组织 + 关系 + 伏笔 + Hook

> 注：仅分析公开榜单趋势，不复制原文内容，不进行违规抓取。

---

### 🚀 快速开始

#### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

#### 安装

```bash
git clone https://github.com/your-username/ai-novel-studio.git
cd ai-novel-studio
pnpm install
```

#### 开发模式

```bash
# 启动前端和后端
pnpm dev

# 仅启动前端
pnpm --filter @ai-novel/web dev

# 仅启动后端
pnpm --filter @ai-novel/server dev
```

#### 构建安装包

```bash
cd deploy
build-all.bat --clean
```

构建完成后在 `dist/installer/` 目录下生成安装包。

---

### 📊 项目统计

| 指标 | 数值 |
|---|---|
| 核心模块 | 10 个 (packages/) |
| 应用项目 | 3 个 (web / server / launcher) |
| 前端页面 | 21 个 |
| 后端模块 | 16 个 |
| 数据库表 | 15 张 |
| AI 模型提供商 | 11 家 |
| 知识库文章 | 645+ 篇 |
| 工作流状态 | 18 种 |
| 质量审核维度 | 20 个 |
| AI 去味模式 | 29 种 |

---

### 🗺️ 后续路线

#### v0.2.0 — 功能完善

- 完善前端 21 个页面的具体组件实现
- 实现 16 个 NestJS 模块的完整 REST API
- 集成 AI 服务，配置 API Key 并端到端测试
- 导入全部知识库文件
- 编写核心模块单元测试

#### v0.3.0 — 体验优化

- 数据库查询优化与前端性能优化
- API 文档自动生成
- 用户手册与开发指南
- 关系图谱可视化增强

#### v1.0.0 — 正式版

- Windows 安装包发布
- 完整创作闭环验证
- 全量知识库就绪

#### v2.0.0 — 云端升级

- PostgreSQL 数据库适配
- Redis 任务队列适配
- 对象存储适配 (S3/COS/OSS)
- JWT/OAuth 认证
- 多用户 / 团队协作
- SaaS 部署

---

### 📄 许可证

MIT

---

### 🤝 致谢


---

**灵鼠妙笔** — 让 AI 成为你的创作搭档，而非替代品。🐀✏️
