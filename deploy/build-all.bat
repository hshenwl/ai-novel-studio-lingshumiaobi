@echo off
REM AI Novel Studio Complete Build and Package Script
REM 
REM This script builds the entire application and creates the installer

setlocal EnableDelayedExpansion

REM 配置
set VERSION=1.0.0
set ROOT_DIR=%~dp0..\..
set DIST_DIR=%ROOT_DIR%\dist
set APPS_DIR=%ROOT_DIR%\apps
set DEPLOY_DIR=%ROOT_DIR%\deploy

REM 颜色代码
set GREEN=[92m
set RED=[91m
set YELLOW=[93m
set BLUE=[94m
set RESET=[0m

echo.
echo %GREEN%========================================%RESET%
echo %GREEN%  AI Novel Studio Build Pipeline%RESET%
echo %GREEN%  Version: %VERSION%%RESET%
echo %GREEN%========================================%RESET%
echo.

REM 解析参数
set BUILD_FRONTEND=1
set BUILD_BACKEND=1
set BUILD_LAUNCHER=1
set BUILD_INSTALLER=1
set CLEAN_BUILD=0

:parse_args
if "%~1"=="" goto end_parse
if /i "%~1"=="--no-frontend" set BUILD_FRONTEND=0
if /i "%~1"=="--no-backend" set BUILD_BACKEND=0
if /i "%~1"=="--no-launcher" set BUILD_LAUNCHER=0
if /i "%~1"=="--no-installer" set BUILD_INSTALLER=0
if /i "%~1"=="--clean" set CLEAN_BUILD=1
shift
goto parse_args
:end_parse

REM 切换到项目根目录
cd /d %ROOT_DIR%

REM 清理构建目录
if %CLEAN_BUILD%==1 (
    echo %YELLOW%Cleaning build directories...%RESET%
    if exist %DIST_DIR% rmdir /s /q %DIST_DIR%
    echo Clean complete.
    echo.
)

REM 创建dist目录
if not exist %DIST_DIR% mkdir %DIST_DIR%

REM ==========================================
REM Step 1: Build Frontend (React)
REM ==========================================
if %BUILD_FRONTEND%==1 (
    echo.
    echo %BLUE%[1/4] Building Frontend (React)...%RESET%
    echo.
    
    cd /d %APPS_DIR%\web
    
    REM 检查package.json
    if not exist package.json (
        echo %RED%Error: Frontend package.json not found%RESET%
        exit /b 1
    )
    
    REM 安装依赖
    echo %YELLOW%Installing frontend dependencies...%RESET%
    call pnpm install --frozen-lockfile
    if %errorlevel% neq 0 (
        echo %RED%Failed to install frontend dependencies%RESET%
        exit /b 1
    )
    
    REM 构建前端
    echo %YELLOW%Building frontend...%RESET%
    call pnpm run build
    if %errorlevel% neq 0 (
        echo %RED%Failed to build frontend%RESET%
        exit /b 1
    )
    
    REM 复制构建产物
    echo %YELLOW%Copying frontend build to dist...%RESET%
    if not exist %DIST_DIR%\frontend mkdir %DIST_DIR%\frontend
    xcopy /s /e /y /q build\* %DIST_DIR%\frontend\
    
    echo %GREEN%Frontend build complete.%RESET%
)

REM ==========================================
REM Step 2: Build Backend (NestJS)
REM ==========================================
if %BUILD_BACKEND%==1 (
    echo.
    echo %BLUE%[2/4] Building Backend (NestJS)...%RESET%
    echo.
    
    cd /d %APPS_DIR%\server
    
    REM 检查package.json
    if not exist package.json (
        echo %RED%Error: Backend package.json not found%RESET%
        exit /b 1
    )
    
    REM 安装依赖
    echo %YELLOW%Installing backend dependencies...%RESET%
    call pnpm install --frozen-lockfile
    if %errorlevel% neq 0 (
        echo %RED%Failed to install backend dependencies%RESET%
        exit /b 1
    )
    
    REM 构建后端
    echo %YELLOW%Building backend...%RESET%
    call pnpm run build
    if %errorlevel% neq 0 (
        echo %RED%Failed to build backend%RESET%
        exit /b 1
    )
    
    REM 复制构建产物
    echo %YELLOW%Copying backend build to dist...%RESET%
    if not exist %DIST_DIR%\backend mkdir %DIST_DIR%\backend
    
    REM 复制dist目录
    xcopy /s /e /y /q dist\* %DIST_DIR%\backend\dist\
    
    REM 复制package.json和必要的文件
    copy package.json %DIST_DIR%\backend\
    copy package-lock.json %DIST_DIR%\backend\ 2>nul
    copy .env.production %DIST_DIR%\backend\.env 2>nul
    
    REM 复制node_modules（生产依赖）
    echo %YELLOW%Installing production dependencies...%RESET%
    cd /d %DIST_DIR%\backend
    call pnpm install --prod --frozen-lockfile
    
    echo %GREEN%Backend build complete.%RESET%
)

REM ==========================================
REM Step 3: Build Launcher (Go)
REM ==========================================
if %BUILD_LAUNCHER%==1 (
    echo.
    echo %BLUE%[3/4] Building Launcher (Go)...%RESET%
    echo.
    
    cd /d %APPS_DIR%\launcher\go-launcher
    
    REM 检查Go环境
    where go >nul 2>&1
    if %errorlevel% neq 0 (
        echo %RED%Error: Go is not installed%RESET%
        exit /b 1
    )
    
    REM 构建启动器
    echo %YELLOW%Building launcher...%RESET%
    call build.bat
    if %errorlevel% neq 0 (
        echo %RED%Failed to build launcher%RESET%
        exit /b 1
    )
    
    REM 复制启动器
    echo %YELLOW%Copying launcher to dist...%RESET%
    copy dist\launcher.exe %DIST_DIR%\launcher.exe
    
    echo %GREEN%Launcher build complete.%RESET%
)

REM ==========================================
REM Step 4: Prepare Node.js Runtime
REM ==========================================
echo.
echo %BLUE%[4/4] Preparing Node.js Runtime...%RESET%
echo.

set NODEJS_DIR=%DIST_DIR%\nodejs
if not exist %NODEJS_DIR% mkdir %NODEJS_DIR%

REM 检查是否已有Node.js运行时
if not exist %NODEJS_DIR%\node.exe (
    echo %YELLOW%Downloading embedded Node.js...%RESET%
    
    REM 使用项目自带的Node.js或下载
    where node >nul 2>&1
    if %errorlevel%==0 (
        REM 复制系统Node.js（简化方案）
        for /f "tokens=*" %%i in ('where node') do set NODE_EXE=%%i
        set NODE_DIR=!NODE_EXE:\node.exe=!
        
        echo Copying Node.js from: !NODE_DIR!
        xcopy /s /e /y /q "!NODE_DIR!\*" %NODEJS_DIR%\
    ) else (
        echo %RED%Error: Node.js not found. Please install Node.js first.%RESET%
        exit /b 1
    )
)

echo %GREEN%Node.js runtime prepared.%RESET%

REM ==========================================
REM Step 5: Create Installer
REM ==========================================
if %BUILD_INSTALLER%==1 (
    echo.
    echo %BLUE%[5/5] Creating Installer...%RESET%
    echo.
    
    cd /d %DEPLOY_DIR%\installer
    
    REM 检查Inno Setup
    where iscc >nul 2>&1
    if %errorlevel% neq 0 (
        echo %YELLOW%Warning: Inno Setup Compiler (iscc) not found in PATH%RESET%
        echo Looking for default installation...
        
        REM 查找Inno Setup默认安装路径
        if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
            set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
        ) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
            set ISCC="C:\Program Files\Inno Setup 6\ISCC.exe"
        ) else (
            echo %RED%Error: Inno Setup not found%RESET%
            echo Please install Inno Setup 6 from: https://jrsoftware.org/isdl.php
            exit /b 1
        )
    ) else (
        set ISCC=iscc
    )
    
    REM 编译安装脚本
    echo %YELLOW%Compiling installer...%RESET%
    %ISCC% setup.iss
    if %errorlevel% neq 0 (
        echo %RED%Failed to create installer%RESET%
        exit /b 1
    )
    
    echo %GREEN%Installer created successfully.%RESET%
)

REM ==========================================
REM Summary
REM ==========================================
echo.
echo %GREEN%========================================%RESET%
echo %GREEN%  Build Complete!%RESET%
echo %GREEN%========================================%RESET%
echo.
echo Output:
echo   - Frontend: %DIST_DIR%\frontend
echo   - Backend:  %DIST_DIR%\backend
echo   - Launcher: %DIST_DIR%\launcher.exe
echo   - Node.js:  %DIST_DIR%\nodejs
if %BUILD_INSTALLER%==1 (
    echo   - Installer: %DIST_DIR%\installer\ai-novel-studio-%VERSION%-setup.exe
)
echo.

REM 显示dist目录大小
for /f "tokens=3" %%a in ('dir /s %DIST_DIR% ^| find "File(s)"') do set TOTAL_SIZE=%%a
echo Total size: %TOTAL_SIZE% bytes
echo.

endlocal