@echo off
REM AI Novel Studio Launcher Build Script
REM 
REM This script builds the Go launcher for Windows

setlocal EnableDelayedExpansion

REM 配置
set APP_NAME=ai-novel-launcher
set VERSION=1.0.0
set BUILD_DIR=build
set OUTPUT_DIR=dist

REM 颜色代码
set GREEN=[92m
set RED=[91m
set YELLOW=[93m
set RESET=[0m

echo %GREEN%=== AI Novel Studio Launcher Build Script ===%RESET%
echo.

REM 检查Go环境
echo %YELLOW%Checking Go environment...%RESET%
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%Error: Go is not installed or not in PATH%RESET%
    exit /b 1
)

for /f "tokens=3 delims=." %%v in ('go version') do (
    set GO_VERSION=%%v
    echo Go version: !GO_VERSION!
)

REM 清理构建目录
echo.
echo %YELLOW%Cleaning build directory...%RESET%
if exist %BUILD_DIR% rmdir /s /q %BUILD_DIR%
if exist %OUTPUT_DIR% rmdir /s /q %OUTPUT_DIR%
mkdir %BUILD_DIR%
mkdir %OUTPUT_DIR%

REM 安装依赖
echo.
echo %YELLOW%Installing dependencies...%RESET%
go mod download
go mod tidy

REM 构建参数
set LDFLAGS=-s -w -H windowsgui
set BUILD_ARGS=-ldflags="%LDFLAGS%" -trimpath -tags=release

REM 构建Windows可执行文件
echo.
echo %YELLOW%Building Windows executable...%RESET%
echo Version: %VERSION%
echo Build args: %BUILD_ARGS%

go build %BUILD_ARGS% -o %OUTPUT_DIR%\launcher.exe .

if %errorlevel% neq 0 (
    echo %RED%Build failed!%RESET%
    exit /b 1
)

echo %GREEN%Build successful!%RESET%

REM 创建资源目录
mkdir %OUTPUT_DIR%\assets

REM 检查输出
echo.
echo %YELLOW%Build output:%RESET%
dir %OUTPUT_DIR%\*.exe

REM 显示大小
for %%f in (%OUTPUT_DIR%\launcher.exe) do (
    set SIZE=%%~zf
    echo File size: !SIZE! bytes
)

echo.
echo %GREEN%=== Build Complete ===%RESET%
echo Output directory: %OUTPUT_DIR%
echo.

REM 可选：创建发布包
if "%1"=="--release" (
    echo %YELLOW%Creating release package...%RESET%
    
    REM 创建临时目录
    set RELEASE_DIR=release-%VERSION%
    mkdir %RELEASE_DIR%
    
    REM 复制文件
    copy %OUTPUT_DIR%\launcher.exe %RELEASE_DIR%\
    copy README.md %RELEASE_DIR%\ 2>nul
    copy LICENSE %RELEASE_DIR%\ 2>nul
    
    REM 创建压缩包
    powershell Compress-Archive -Path %RELEASE_DIR%\* -DestinationPath %RELEASE_DIR%.zip -Force
    
    echo %GREEN%Release package created: %RELEASE_DIR%.zip%RESET%
)

endlocal