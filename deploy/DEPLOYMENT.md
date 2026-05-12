# AI Novel Studio - 部署指南

## 目录

- [概述](#概述)
- [构建环境要求](#构建环境要求)
- [快速开始](#快速开始)
- [详细构建步骤](#详细构建步骤)
- [打包发布](#打包发布)
- [安装测试](#安装测试)
- [故障排查](#故障排查)

## 概述

AI Novel Studio 使用以下技术栈：

- **前端**: React + TypeScript
- **后端**: NestJS + TypeScript
- **启动器**: Go (Windows桌面应用)
- **安装包**: Inno Setup 6

### 构建产物

构建完成后会生成：

```
dist/
├── frontend/              # 前端静态文件
├── backend/               # 后端编译产物
│   ├── dist/             # NestJS编译结果
│   └── node_modules/     # 生产依赖
├── nodejs/                # Node.js运行时
├── launcher.exe           # 启动器
└── installer/             # 安装包
    └── ai-novel-studio-1.0.0-setup.exe
```

## 构建环境要求

### 必需软件

| 软件 | 版本 | 用途 | 下载地址 |
|------|------|------|----------|
| Node.js | 18.x LTS | 前后端构建 | https://nodejs.org/ |
| pnpm | 8.x | 包管理器 | `npm install -g pnpm` |
| Go | 1.21+ | 启动器构建 | https://golang.org/dl/ |
| Inno Setup | 6.x | 安装包制作 | https://jrsoftware.org/isdl.php |

### 可选软件

| 软件 | 用途 |
|------|------|
| Git | 版本控制 |
| Visual Studio Code | 代码编辑 |
| PowerShell 7+ | 构建脚本 |

### 环境验证

```bash
# 验证Node.js
node --version    # v18.x.x
npm --version     # 9.x.x

# 验证pnpm
pnpm --version    # 8.x.x

# 验证Go
go version        # go1.21.x

# 验证Inno Setup
iscc /?          # 或检查默认安装路径
```

## 快速开始

### 一键构建

```bash
# Windows (CMD)
cd deploy
build-all.bat

# 或 PowerShell
cd deploy
.\build-all.ps1

# 清理构建后重新编译
build-all.bat --clean
```

### 静默安装测试

```bash
# 构建安装包后测试安装
dist\installer\ai-novel-studio-1.0.0-setup.exe /SILENT
```

## 详细构建步骤

### Step 1: 准备环境

```bash
# 1. 克隆代码（如适用）
git clone https://github.com/ai-novel-studio/ai-novel-studio.git
cd ai-novel-studio

# 2. 安装根依赖
pnpm install

# 3. 验证项目结构
ls apps/
# 应该看到: web/ server/ launcher/
```

### Step 2: 构建前端

```bash
cd apps/web

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 验证构建产物
ls build/
```

**前端构建产物**：
- `build/index.html` - 入口文件
- `build/static/` - 静态资源
- `build/assets/` - 图片、字体等

### Step 3: 构建后端

```bash
cd apps/server

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm run build

# 验证构建产物
ls dist/
```

**后端构建产物**：
- `dist/main.js` - 入口文件
- `dist/**/*.js` - 编译后的代码

### Step 4: 构建启动器

```bash
cd apps/launcher/go-launcher

# 安装Go依赖
go mod download

# 构建
build.bat

# 验证构建产物
ls dist/launcher.exe
```

**启动器特性**：
- Windows GUI应用（无控制台窗口）
- 系统托盘图标
- 自动启动后端服务
- 自动打开浏览器

### Step 5: 准备Node.js运行时

```bash
# 方法一：使用系统Node.js（推荐）
# build-all.bat会自动复制

# 方法二：下载嵌入式Node.js
# 下载地址：https://nodejs.org/dist/
# 选择：node-v18.x.x-win-x64.zip
# 解压到：dist/nodejs/
```

### Step 6: 创建安装包

```bash
cd deploy/installer

# 编译Inno Setup脚本
iscc setup.iss

# 或使用默认路径
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss

# 验证安装包
ls ../../dist/installer/*.exe
```

## 打包发布

### 版本管理

更新版本号需要修改以下文件：

1. `package.json` (根目录)
2. `apps/web/package.json`
3. `apps/server/package.json`
4. `apps/launcher/go-launcher/build.bat`
5. `deploy/installer/setup.iss`

### 发布检查清单

- [ ] 更新版本号
- [ ] 更新CHANGELOG.md
- [ ] 运行完整测试
- [ ] 清理构建目录
- [ ] 执行完整构建
- [ ] 测试安装包
- [ ] 创建Git标签
- [ ] 上传发布包

### 构建命令

```bash
# 完整构建（清理 + 编译）
build-all.bat --clean

# 仅构建前端和后端
build-all.bat --no-launcher --no-installer

# 仅创建安装包（假设已有构建产物）
build-all.bat --no-frontend --no-backend --no-launcher
```

### 发布包命名

```
ai-novel-studio-{VERSION}-setup.exe
ai-novel-studio-{VERSION}-portable.zip
```

示例：
```
ai-novel-studio-1.0.0-setup.exe
ai-novel-studio-1.0.0-portable.zip
```

## 安装测试

### 测试环境

建议在以下环境测试：

- Windows 10 (64位)
- Windows 11 (64位)
- 虚拟机（干净环境）

### 测试步骤

#### 1. 安装测试

```bash
# 运行安装程序
ai-novel-studio-1.0.0-setup.exe

# 静默安装测试
ai-novel-studio-1.0.0-setup.exe /SILENT

# 自定义路径安装
ai-novel-studio-1.0.0-setup.exe /DIR="D:\TestPath"
```

#### 2. 功能测试

- [ ] 安装成功，桌面快捷方式创建
- [ ] 启动器启动正常
- [ ] 系统托盘图标显示
- [ ] 后端服务启动
- [ ] 浏览器自动打开
- [ ] 界面正常显示
- [ ] 基本功能可用

#### 3. 卸载测试

```bash
# 通过控制面板卸载
# 或运行
"C:\Program Files\AI Novel Studio\unins000.exe"

# 静默卸载
unins000.exe /SILENT

# 验证清理
# - 程序文件已删除
# - 快捷方式已删除
# - 注册表项已清理
```

### 回归测试

每次发布前应测试：

1. **全新安装**: 在干净系统上安装
2. **升级安装**: 从旧版本升级
3. **覆盖安装**: 重新安装同一版本
4. **便携版**: 解压即用版本
5. **多用户**: 不同Windows用户账户

## 故障排查

### 构建问题

#### 前端构建失败

```bash
# 清理依赖重装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 清理构建缓存
rm -rf build
pnpm build
```

#### 后端构建失败

```bash
# 检查TypeScript错误
pnpm run build --verbose

# 清理重试
rm -rf dist node_modules
pnpm install
pnpm run build
```

#### Go编译失败

```bash
# 检查Go版本
go version  # 需要1.21+

# 更新依赖
go mod tidy
go mod download

# 清理缓存
go clean -cache
go build
```

#### Inno Setup编译失败

```
检查：
1. iscc是否在PATH中
2. setup.iss中的路径是否正确
3. 图标文件是否存在
4. 编码是否为UTF-8 BOM
```

### 安装问题

#### 安装程序无法运行

- 检查是否有杀毒软件拦截
- 以管理员身份运行
- 检查系统兼容性（需要Win10+）

#### 安装后无法启动

- 检查端口是否被占用：`netstat -ano | findstr :18765`
- 查看日志文件：`logs/app.log`
- 检查Node.js运行时是否完整

#### 服务启动失败

- 查看启动器日志
- 检查配置文件格式
- 验证文件完整性

### 运行时问题

#### 浏览器未自动打开

- 手动访问：http://127.0.0.1:18765
- 检查默认浏览器设置
- 查看启动器日志

#### 托盘图标不显示

- 检查系统托盘设置
- 验证图标文件路径
- 重启启动器

#### 端口冲突

```bash
# 查找占用进程
netstat -ano | findstr :18765

# 结束进程（谨慎操作）
taskkill /PID <PID> /F

# 或修改launcher.json中的端口配置
```

## 附录

### 构建脚本参数

#### build-all.bat

| 参数 | 说明 |
|------|------|
| `--clean` | 清理构建目录后重新编译 |
| `--no-frontend` | 跳过前端构建 |
| `--no-backend` | 跳过后端构建 |
| `--no-launcher` | 跳过启动器构建 |
| `--no-installer` | 跳过安装包创建 |

#### build-all.ps1

| 参数 | 说明 |
|------|------|
| `-Clean` | 清理构建目录 |
| `-NoFrontend` | 跳过前端构建 |
| `-NoBackend` | 跳过后端构建 |
| `-NoLauncher` | 跳过启动器构建 |
| `-NoInstaller` | 跳过安装包创建 |
| `-Version "1.0.0"` | 指定版本号 |

### 目录结构

```
ai-novel-studio/
├── apps/
│   ├── web/                 # 前端项目
│   ├── server/              # 后端项目
│   └── launcher/            # 启动器项目
│       └── go-launcher/
├── deploy/
│   ├── build-all.bat        # Windows构建脚本
│   ├── build-all.ps1        # PowerShell构建脚本
│   ├── first-launch.bat     # 首次启动脚本
│   ├── INSTALL.md           # 安装说明
│   ├── DEPLOYMENT.md        # 本文档
│   └── installer/
│       └── setup.iss        # Inno Setup脚本
├── dist/                    # 构建输出
├── config/                  # 配置文件
├── knowledge/               # 知识库
├── resources/               # 资源文件
└── README.md
```

### 相关文档

- [安装说明](./INSTALL.md)
- [启动器文档](../apps/launcher/go-launcher/README.md)
- [项目README](../README.md)

---

**版本**: 1.0.0  
**更新日期**: 2026-05-04  
**维护者**: AI Novel Studio Team
