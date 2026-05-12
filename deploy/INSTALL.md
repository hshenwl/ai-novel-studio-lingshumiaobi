# AI Novel Studio 安装说明

## 目录

- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [首次启动](#首次启动)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [卸载说明](#卸载说明)

## 系统要求

### 最低配置

- **操作系统**: Windows 10 (64位) 或更高版本
- **内存**: 4 GB RAM
- **硬盘空间**: 500 MB 可用空间
- **网络**: 需要网络连接（用于AI模型调用）

### 推荐配置

- **操作系统**: Windows 11 (64位)
- **内存**: 8 GB RAM 或更高
- **硬盘空间**: 1 GB 可用空间
- **处理器**: Intel Core i5 或更高

## 安装步骤

### 方法一：使用安装程序（推荐）

1. **下载安装程序**
   - 下载 `ai-novel-studio-1.0.0-setup.exe`
   - 建议从官方渠道下载以确保安全

2. **运行安装程序**
   - 双击运行安装程序
   - 如果出现用户账户控制提示，点击"是"
   - 选择安装语言（中文/英文）

3. **阅读许可协议**
   - 阅读并同意许可协议
   - 点击"下一步"继续

4. **选择安装位置**
   - 默认安装路径：`C:\Program Files\AI Novel Studio`
   - 点击"浏览"可以自定义安装路径
   - 点击"下一步"继续

5. **选择附加任务**
   - ☑ 创建桌面快捷方式（推荐）
   - ☑ 创建快速启动快捷方式
   - ☑ 关联 .novel 文件（推荐）

6. **开始安装**
   - 点击"安装"按钮
   - 等待安装完成（约1-2分钟）

7. **完成安装**
   - ☑ 启动 AI Novel Studio
   - 点击"完成"退出安装程序

### 方法二：便携版（无需安装）

1. 下载便携版压缩包
2. 解压到任意目录
3. 运行 `launcher.exe`

### 方法三：静默安装（适用于企业部署）

```cmd
ai-novel-studio-1.0.0-setup.exe /SILENT
```

或完全静默（无界面）：

```cmd
ai-novel-studio-1.0.0-setup.exe /VERYSILENT
```

自定义安装路径：

```cmd
ai-novel-studio-1.0.0-setup.exe /SILENT /DIR="D:\CustomPath"
```

## 首次启动

### 启动应用

1. **通过桌面快捷方式**
   - 双击桌面上的"AI Novel Studio"图标

2. **通过开始菜单**
   - 点击"开始"菜单
   - 找到"AI Novel Studio"程序组
   - 点击"AI Novel Studio"

3. **通过可执行文件**
   - 导航到安装目录
   - 双击 `launcher.exe`

### 首次启动引导

首次启动时，应用会自动：

1. ✅ 创建必要的目录结构
2. ✅ 生成配置文件
3. ✅ 初始化数据库
4. ✅ 检查端口占用
5. ✅ 启动后端服务
6. ✅ 打开浏览器界面

### 系统托盘图标

应用启动后会在系统托盘显示图标：

- **左键单击**: 打开应用界面
- **右键单击**: 显示菜单
  - 打开界面
  - 启动/停止服务
  - 查看日志
  - 退出

## 配置说明

### 配置文件位置

配置文件位于安装目录：

```
AI Novel Studio/
├── .env                    # 环境变量配置
├── launcher.json           # 启动器配置
├── config/                 # 应用配置
│   ├── agents/            # Agent规则配置
│   └── prompts/           # Prompt模板
└── data/                   # 用户数据
    ├── database.db        # 数据库文件
    └── workspace/         # 工作区
```

### 环境变量配置 (.env)

编辑 `.env` 文件进行配置：

```env
# 服务端口
PORT=18765

# 运行环境
NODE_ENV=production

# 数据库配置
DATABASE_URL=file:./data/database.db

# AI模型配置
AI_MODEL_PROVIDER=openai
AI_MODEL_API_KEY=your-api-key-here
AI_MODEL_NAME=gpt-4

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 启动器配置 (launcher.json)

编辑 `launcher.json` 文件：

```json
{
  "defaultPort": 18765,
  "minPort": 18765,
  "maxPort": 18775,
  "backendPath": "backend",
  "frontendPath": "frontend",
  "nodePath": "nodejs/node.exe",
  "autoOpenBrowser": true,
  "enableLogWindow": true,
  "trayIconPath": "assets/icon.ico"
}
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `defaultPort` | 默认服务端口 | 18765 |
| `minPort` | 最小端口 | 18765 |
| `maxPort` | 最大端口 | 18775 |
| `backendPath` | 后端目录路径 | backend |
| `frontendPath` | 前端目录路径 | frontend |
| `nodePath` | Node.js可执行文件路径 | nodejs/node.exe |
| `autoOpenBrowser` | 启动时自动打开浏览器 | true |
| `enableLogWindow` | 启用日志窗口 | true |
| `trayIconPath` | 托盘图标路径 | assets/icon.ico |

## 常见问题

### Q1: 端口被占用怎么办？

**A**: 应用会自动检测端口占用并选择下一个可用端口（18765-18775范围）。如果所有端口都被占用，请：

1. 打开命令提示符
2. 运行：`netstat -ano | findstr :18765`
3. 找到占用端口的进程并结束

### Q2: 服务启动失败怎么办？

**A**: 请检查以下项：

1. ✅ 是否有杀毒软件阻止启动
2. ✅ Node.js运行时是否完整
3. ✅ 配置文件是否正确
4. ✅ 查看日志文件：`logs/app.log`

### Q3: 无法打开浏览器怎么办？

**A**: 请手动访问：http://127.0.0.1:18765

### Q4: 如何更改数据存储位置？

**A**: 修改 `.env` 文件中的 `DATABASE_URL` 路径：

```env
DATABASE_URL=file:D:/CustomPath/database.db
```

### Q5: 如何更新应用？

**A**: 
1. 下载最新版本安装程序
2. 运行安装程序覆盖安装
3. 配置和数据会自动保留

### Q6: 如何查看日志？

**A**: 三种方式：
1. 系统托盘右键菜单 → 查看日志
2. 直接打开 `logs/app.log` 文件
3. 启动日志窗口（启动器设置）

### Q7: 如何配置AI模型？

**A**: 编辑 `.env` 文件：

```env
# OpenAI
AI_MODEL_PROVIDER=openai
AI_MODEL_API_KEY=sk-xxxxx
AI_MODEL_NAME=gpt-4

# 或 Claude
AI_MODEL_PROVIDER=claude
AI_MODEL_API_KEY=sk-ant-xxxxx
AI_MODEL_NAME=claude-3-opus-20240229

# 或 本地模型
AI_MODEL_PROVIDER=ollama
AI_MODEL_NAME=llama2
```

## 卸载说明

### 方法一：通过控制面板

1. 打开"控制面板" → "程序" → "程序和功能"
2. 找到"AI Novel Studio"
3. 右键选择"卸载"
4. 按照提示完成卸载

### 方法二：通过安装目录

1. 导航到安装目录
2. 运行 `unins000.exe`
3. 按照提示完成卸载

### 方法三：静默卸载

```cmd
"C:\Program Files\AI Novel Studio\unins000.exe" /SILENT
```

### 卸载时保留数据

卸载时会询问是否删除用户数据：

- **选择"是"**: 删除所有数据（工作区、知识库、配置等）
- **选择"否"**: 保留用户数据目录

### 完全清理

如需完全清理，请手动删除：

```
%APPDATA%\AI Novel Studio\
%LOCALAPPDATA%\AI Novel Studio\
```

## 技术支持

如遇到问题，请通过以下方式获取帮助：

- 📖 查看文档：https://github.com/ai-novel-studio/docs
- 🐛 提交Issue：https://github.com/ai-novel-studio/issues
- 💬 社区讨论：https://github.com/ai-novel-studio/discussions

## 许可证

本软件遵循 MIT 许可证。详见 `LICENSE` 文件。

---

**版本**: 1.0.0  
**更新日期**: 2026-05-04  
**文档版本**: 1.0
