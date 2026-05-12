@echo off
REM AI Novel Studio First Launch Setup Script
REM
REM This script runs on first launch to setup the environment

setlocal EnableDelayedExpansion

echo.
echo === AI Novel Studio First Launch Setup ===
echo.

REM 获取应用目录
set APP_DIR=%~dp0

REM 检查是否已经初始化
if exist "%APP_DIR%\.initialized" (
    echo Application already initialized.
    goto :end
)

echo Initializing application...
echo.

REM Step 1: 创建必要的目录
echo Creating directories...
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"
if not exist "%APP_DIR%\data" mkdir "%APP_DIR%\data"
if not exist "%APP_DIR%\cache" mkdir "%APP_DIR%\cache"
if not exist "%APP_DIR%\temp" mkdir "%APP_DIR%\temp"
if not exist "%APP_DIR%\workspace" mkdir "%APP_DIR%\workspace"
if not exist "%APP_DIR%\output" mkdir "%APP_DIR%\output"

echo Directories created.
echo.

REM Step 2: 创建配置文件
echo Creating configuration files...

REM 创建.env文件（如果不存在）
if not exist "%APP_DIR%\.env" (
    if exist "%APP_DIR%\.env.example" (
        copy "%APP_DIR%\.env.example" "%APP_DIR%\.env" >nul
        echo .env file created from template.
    ) else (
        (
            echo # AI Novel Studio Configuration
            echo PORT=18765
            echo NODE_ENV=production
            echo.
            echo # Database Configuration
            echo DATABASE_URL=file:./data/database.db
            echo.
            echo # AI Model Configuration
            echo AI_MODEL_PROVIDER=openai
            echo AI_MODEL_API_KEY=your-api-key-here
            echo AI_MODEL_NAME=gpt-4
            echo.
            echo # Logging
            echo LOG_LEVEL=info
            echo LOG_FILE=logs/app.log
        ) > "%APP_DIR%\.env"
        echo .env file created with defaults.
    )
)

REM 创建launcher.json（如果不存在）
if not exist "%APP_DIR%\launcher.json" (
    (
        echo {
        echo   "defaultPort": 18765,
        echo   "minPort": 18765,
        echo   "maxPort": 18775,
        echo   "backendPath": "backend",
        echo   "frontendPath": "frontend",
        echo   "nodePath": "nodejs/node.exe",
        echo   "autoOpenBrowser": true,
        echo   "enableLogWindow": true,
        echo   "trayIconPath": "assets/icon.ico"
        echo }
    ) > "%APP_DIR%\launcher.json"
    echo launcher.json file created.
)

echo Configuration files created.
echo.

REM Step 3: 初始化数据库（如果需要）
echo Initializing database...
if exist "%APP_DIR%\backend\dist\main.js" (
    "%APP_DIR%\nodejs\node.exe" "%APP_DIR%\backend\dist\main.js" --init-db
    if !errorlevel! neq 0 (
        echo Warning: Database initialization failed. Will be created on first run.
    ) else (
        echo Database initialized successfully.
    )
) else (
    echo Warning: Backend not found. Database will be created on first run.
)

echo.

REM Step 4: 创建知识库索引（如果需要）
echo Creating knowledge base index...
if exist "%APP_DIR%\knowledge" (
    echo Knowledge base directory found.
    REM 可以在这里添加知识库索引创建逻辑
) else (
    echo Warning: Knowledge base directory not found.
)

echo.

REM Step 5: 创建初始化标记文件
echo. > "%APP_DIR%\.initialized"
echo Initialization complete.
echo.

echo === Setup Complete ===
echo.
echo You can now launch the application using launcher.exe
echo.

:end
endlocal