# AI Novel Studio - Windows Launcher

Windows桌面启动器，用于启动和管理AI Novel Studio应用。

## 功能特性

- ✅ 自动启动后端Web服务（NestJS）
- ✅ 自动打开浏览器访问应用界面
- ✅ 系统托盘图标，右键菜单支持
- ✅ 日志窗口显示服务状态
- ✅ 自动检测端口占用，选择可用端口
- ✅ 优雅关闭服务

## 技术栈

- **语言**: Go 1.21+
- **系统托盘**: github.com/getlantern/systray
- **浏览器打开**: github.com/skratchdot/open-golang

## 项目结构

```
go-launcher/
├── main.go              # 主程序入口
├── tray.go              # 系统托盘管理
├── logwindow.go         # 日志窗口
├── platform_windows.go  # Windows平台特定功能
├── go.mod               # Go模块定义
├── build.bat            # 构建脚本（Windows）
└── README.md            # 本文档
```

## 构建说明

### 前置要求

1. **Go环境**: 安装Go 1.21或更高版本
   - 下载地址：https://golang.org/dl/
   - 安装后验证：`go version`

2. **依赖安装**:
   ```bash
   go mod download
   ```

### 编译

#### 方法一：使用构建脚本

```bash
# Windows
build.bat

# 或带发布选项
build.bat --release
```

#### 方法二：手动编译

```bash
# 开发版本
go build -o dist/launcher.exe

# 生产版本（优化大小）
go build -ldflags="-s -w -H windowsgui" -trimpath -o dist/launcher.exe
```

### 编译选项说明

- `-ldflags="-s -w"`: 移除调试信息，减小文件大小
- `-ldflags="-H windowsgui"`: 隐藏控制台窗口（GUI应用）
- `-trimpath`: 移除文件路径信息

## 使用说明

### 启动应用

1. **双击运行**: 双击 `launcher.exe`
2. **命令行运行**: `launcher.exe [选项]`

### 命令行选项

```bash
launcher.exe --help          # 显示帮助
launcher.exe --version       # 显示版本
launcher.exe --no-browser    # 启动时不打开浏览器
launcher.exe --port 8080     # 指定端口
launcher.exe --stop          # 停止运行中的服务
```

### 系统托盘

启动后，应用会在系统托盘显示图标：

**右键菜单选项**：
- 打开界面：在浏览器中打开应用
- 状态：显示服务运行状态
- 启动服务：启动后端服务
- 停止服务：停止后端服务
- 查看日志：打开日志窗口
- 退出：退出应用程序

### 配置文件

配置文件位于应用目录：`launcher.json`

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

**配置说明**：

| 配置项 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| defaultPort | int | 默认服务端口 | 18765 |
| minPort | int | 最小端口号 | 18765 |
| maxPort | int | 最大端口号 | 18775 |
| backendPath | string | 后端目录路径 | backend |
| frontendPath | string | 前端目录路径 | frontend |
| nodePath | string | Node.js可执行文件路径 | nodejs/node.exe |
| autoOpenBrowser | bool | 启动时自动打开浏览器 | true |
| enableLogWindow | bool | 启用日志窗口 | true |
| trayIconPath | string | 托盘图标文件路径 | assets/icon.ico |

## 开发指南

### 代码结构

#### main.go

主程序入口，包含：
- 配置加载
- 端口检测
- 后端服务启动/停止
- 日志管理

#### tray.go

系统托盘管理，包含：
- 托盘图标设置
- 右键菜单管理
- 事件处理

#### logwindow.go

日志窗口管理，包含：
- 日志显示
- 日志导出
- 日志文件管理

#### platform_windows.go

Windows平台特定功能：
- 控制台标题设置
- 错误对话框显示
- 文件操作

### 添加新功能

#### 1. 添加新的配置项

在 `main.go` 的 `Config` 结构体中添加：

```go
type Config struct {
    // 现有配置...
    NewConfig string `json:"newConfig"`
}
```

#### 2. 添加新的菜单项

在 `tray.go` 的 `Setup()` 方法中添加：

```go
mNew := systray.AddMenuItem("新功能", "新功能描述")
```

并在 `handleEvents()` 中处理：

```go
case <-t.mNew.ClickedCh:
    // 处理点击事件
```

#### 3. 添加新的命令行选项

在 `main.go` 中添加解析逻辑：

```go
flag.String("newopt", "", "新选项说明")
flag.Parse()
```

## 故障排查

### 常见问题

#### 1. 启动失败："找不到Node.js"

**解决方案**：
- 检查 `nodePath` 配置是否正确
- 确保 Node.js 运行时已正确打包

#### 2. 端口被占用

**解决方案**：
- 应用会自动检测并选择下一个可用端口
- 或手动修改 `defaultPort` 配置

#### 3. 托盘图标不显示

**解决方案**：
- 检查 `trayIconPath` 配置
- 确保图标文件存在且格式正确（ICO格式）

#### 4. 浏览器未自动打开

**解决方案**：
- 检查 `autoOpenBrowser` 配置
- 或手动访问：http://127.0.0.1:18765

### 日志查看

日志文件位置：`logs/launcher.log`

查看方式：
1. 系统托盘右键 → 查看日志
2. 直接打开日志文件

## 打包发布

### 完整打包流程

参见根目录的 `deploy/build-all.bat` 脚本，会自动：
1. 构建前端
2. 构建后端
3. 构建启动器
4. 准备Node.js运行时
5. 创建安装包

### 单独打包启动器

```bash
# 构建
build.bat --release

# 输出
dist/launcher.exe
```

## 许可证

MIT License

## 联系方式

- 项目主页：https://github.com/ai-novel-studio
- 问题反馈：https://github.com/ai-novel-studio/issues
