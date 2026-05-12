# AI Novel Studio Build Script (PowerShell)
# 
# This script builds the entire application and creates the installer

param(
    [switch]$Clean,
    [switch]$NoFrontend,
    [switch]$NoBackend,
    [switch]$NoLauncher,
    [switch]$NoInstaller,
    [string]$Version = "1.0.0"
)

# 配置
$ErrorActionPreference = "Stop"
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$DIST_DIR = Join-Path $ROOT_DIR "dist"
$APPS_DIR = Join-Path $ROOT_DIR "apps"
$DEPLOY_DIR = Join-Path $ROOT_DIR "deploy"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n$message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

# 主流程
Write-ColorOutput @"

========================================
  AI Novel Studio Build Pipeline
  Version: $Version
========================================

"@ "Green"

# 清理构建目录
if ($Clean) {
    Write-Step "Cleaning build directories..."
    if (Test-Path $DIST_DIR) {
        Remove-Item -Recurse -Force $DIST_DIR
    }
    Write-Success "Clean complete"
}

# 创建dist目录
if (-not (Test-Path $DIST_DIR)) {
    New-Item -ItemType Directory -Path $DIST_DIR | Out-Null
}

# Step 1: Build Frontend
if (-not $NoFrontend) {
    Write-Step "[1/4] Building Frontend (React)..."
    
    $frontendDir = Join-Path $APPS_DIR "web"
    if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
        Write-Error "Frontend package.json not found"
        exit 1
    }
    
    Push-Location $frontendDir
    
    # 安装依赖
    Write-ColorOutput "Installing frontend dependencies..." "Yellow"
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install frontend dependencies"
        Pop-Location
        exit 1
    }
    
    # 构建
    Write-ColorOutput "Building frontend..." "Yellow"
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend"
        Pop-Location
        exit 1
    }
    
    # 复制构建产物
    $frontendDist = Join-Path $DIST_DIR "frontend"
    if (-not (Test-Path $frontendDist)) {
        New-Item -ItemType Directory -Path $frontendDist | Out-Null
    }
    
    Copy-Item -Recurse -Force "build\*" $frontendDist
    
    Pop-Location
    Write-Success "Frontend build complete"
}

# Step 2: Build Backend
if (-not $NoBackend) {
    Write-Step "[2/4] Building Backend (NestJS)..."
    
    $backendDir = Join-Path $APPS_DIR "server"
    if (-not (Test-Path (Join-Path $backendDir "package.json"))) {
        Write-Error "Backend package.json not found"
        exit 1
    }
    
    Push-Location $backendDir
    
    # 安装依赖
    Write-ColorOutput "Installing backend dependencies..." "Yellow"
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install backend dependencies"
        Pop-Location
        exit 1
    }
    
    # 构建
    Write-ColorOutput "Building backend..." "Yellow"
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend"
        Pop-Location
        exit 1
    }
    
    # 复制构建产物
    $backendDist = Join-Path $DIST_DIR "backend"
    if (-not (Test-Path $backendDist)) {
        New-Item -ItemType Directory -Path $backendDist | Out-Null
    }
    
    Copy-Item -Recurse -Force "dist\*" (Join-Path $backendDist "dist")
    Copy-Item "package.json" $backendDist
    Copy-Item "package-lock.json" $backendDist -ErrorAction SilentlyContinue
    
    # 复制.env.production
    if (Test-Path ".env.production") {
        Copy-Item ".env.production" (Join-Path $backendDist ".env")
    }
    
    # 安装生产依赖
    Write-ColorOutput "Installing production dependencies..." "Yellow"
    Push-Location $backendDist
    pnpm install --prod --frozen-lockfile
    Pop-Location
    
    Pop-Location
    Write-Success "Backend build complete"
}

# Step 3: Build Launcher
if (-not $NoLauncher) {
    Write-Step "[3/4] Building Launcher (Go)..."
    
    $launcherDir = Join-Path $APPS_DIR "launcher\go-launcher"
    if (-not (Test-Path $launcherDir)) {
        Write-Error "Launcher directory not found"
        exit 1
    }
    
    # 检查Go环境
    $goCmd = Get-Command go -ErrorAction SilentlyContinue
    if (-not $goCmd) {
        Write-Error "Go is not installed"
        exit 1
    }
    
    Push-Location $launcherDir
    
    # 构建
    Write-ColorOutput "Building launcher..." "Yellow"
    & .\build.bat
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build launcher"
        Pop-Location
        exit 1
    }
    
    # 复制启动器
    Copy-Item "dist\launcher.exe" $DIST_DIR
    
    Pop-Location
    Write-Success "Launcher build complete"
}

# Step 4: Prepare Node.js Runtime
Write-Step "[4/4] Preparing Node.js Runtime..."

$nodejsDir = Join-Path $DIST_DIR "nodejs"
if (-not (Test-Path $nodejsDir)) {
    New-Item -ItemType Directory -Path $nodejsDir | Out-Null
}

if (-not (Test-Path (Join-Path $nodejsDir "node.exe"))) {
    Write-ColorOutput "Copying Node.js runtime..." "Yellow"
    
    # 查找系统Node.js
    $nodeExe = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeExe) {
        $nodeDir = Split-Path -Parent $nodeExe.Source
        Copy-Item -Recurse -Force "$nodeDir\*" $nodejsDir
        Write-Success "Node.js runtime copied"
    } else {
        Write-Error "Node.js not found"
        exit 1
    }
}

# Step 5: Create Installer
if (-not $NoInstaller) {
    Write-Step "[5/5] Creating Installer..."
    
    $installerDir = Join-Path $DEPLOY_DIR "installer"
    Push-Location $installerDir
    
    # 查找ISCC
    $iscc = Get-Command iscc -ErrorAction SilentlyContinue
    if (-not $iscc) {
        $isccPaths = @(
            "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
            "C:\Program Files\Inno Setup 6\ISCC.exe"
        )
        
        foreach ($path in $isccPaths) {
            if (Test-Path $path) {
                $iscc = $path
                break
            }
        }
    }
    
    if (-not $iscc) {
        Write-Error "Inno Setup not found. Please install from: https://jrsoftware.org/isdl.php"
        Pop-Location
        exit 1
    }
    
    # 编译安装脚本
    Write-ColorOutput "Compiling installer..." "Yellow"
    & $iscc setup.iss
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create installer"
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Success "Installer created"
}

# Summary
Write-ColorOutput @"

========================================
  Build Complete!
========================================

Output:
  - Frontend: $DIST_DIR\frontend
  - Backend:  $DIST_DIR\backend
  - Launcher: $DIST_DIR\launcher.exe
  - Node.js:  $DIST_DIR\nodejs
"@ "Green"

if (-not $NoInstaller) {
    Write-ColorOutput "  - Installer: $DIST_DIR\installer\ai-novel-studio-$Version-setup.exe" "Green"
}

# 显示总大小
$totalSize = (Get-ChildItem -Recurse $DIST_DIR | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-ColorOutput "`nTotal size: $totalSizeMB MB" "White"
