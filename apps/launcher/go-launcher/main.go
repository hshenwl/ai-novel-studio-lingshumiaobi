package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/getlantern/systray"
	"github.com/skratchdot/open-golang/open"
)

// Config 应用配置
type Config struct {
	DefaultPort      int      `json:"defaultPort"`
	MinPort          int      `json:"minPort"`
	MaxPort          int      `json:"maxPort"`
	BackendPath      string   `json:"backendPath"`
	FrontendPath     string   `json:"frontendPath"`
	NodePath         string   `json:"nodePath"`
	AutoOpenBrowser  bool     `json:"autoOpenBrowser"`
	EnableLogWindow  bool     `json:"enableLogWindow"`
	TrayIconPath     string   `json:"trayIconPath"`
}

// Launcher 启动器核心结构
type Launcher struct {
	config       *Config
	port         int
	backendCmd   *exec.Cmd
	logBuffer    []string
	logMutex     sync.Mutex
	quitChan     chan struct{}
	running      bool
	runningMutex sync.Mutex
}

var (
	launcher     *Launcher
	logWindow    *LogWindow
	trayInstance *TrayIcon
)

func main() {
	// 设置控制台标题
	setConsoleTitle("AI Novel Studio Launcher")

	// 初始化启动器
	var err error
	launcher, err = NewLauncher()
	if err != nil {
		showError("初始化失败", err.Error())
		os.Exit(1)
	}

	// 创建日志窗口
	if launcher.config.EnableLogWindow {
		logWindow = NewLogWindow(launcher)
		go logWindow.Show()
	}

	// 启动系统托盘
	systray.Run(launcher.onReady, launcher.onExit)
}

// NewLauncher 创建新的启动器实例
func NewLauncher() (*Launcher, error) {
	l := &Launcher{
		quitChan:  make(chan struct{}),
		logBuffer: make([]string, 0, 1000),
	}

	// 加载配置
	config, err := l.loadConfig()
	if err != nil {
		return nil, fmt.Errorf("加载配置失败: %w", err)
	}
	l.config = config

	// 查找可用端口
	port, err := l.findAvailablePort()
	if err != nil {
		return nil, fmt.Errorf("无法找到可用端口: %w", err)
	}
	l.port = port

	return l, nil
}

// loadConfig 加载配置文件
func (l *Launcher) loadConfig() (*Config, error) {
	config := &Config{
		DefaultPort:     18765,
		MinPort:         18765,
		MaxPort:         18775,
		AutoOpenBrowser: true,
		EnableLogWindow: true,
	}

	// 获取可执行文件所在目录
	exePath, err := os.Executable()
	if err != nil {
		return nil, err
	}
	appDir := filepath.Dir(exePath)

	// 设置默认路径
	config.BackendPath = filepath.Join(appDir, "backend")
	config.FrontendPath = filepath.Join(appDir, "frontend")
	config.NodePath = filepath.Join(appDir, "nodejs", "node.exe")
	config.TrayIconPath = filepath.Join(appDir, "assets", "icon.ico")

	// 尝试加载配置文件
	configPath := filepath.Join(appDir, "launcher.json")
	if data, err := os.ReadFile(configPath); err == nil {
		if err := json.Unmarshal(data, config); err != nil {
			l.log(fmt.Sprintf("解析配置文件失败: %v, 使用默认配置", err))
		} else {
			l.log("加载配置文件成功")
		}
	}

	return config, nil
}

// findAvailablePort 查找可用端口
func (l *Launcher) findAvailablePort() (int, error) {
	for port := l.config.DefaultPort; port <= l.config.MaxPort; port++ {
		ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
		if err == nil {
			ln.Close()
			return port, nil
		}
	}
	return 0, fmt.Errorf("没有可用的端口 (范围: %d-%d)", l.config.MinPort, l.config.MaxPort)
}

// StartBackend 启动后端服务
func (l *Launcher) StartBackend() error {
	l.runningMutex.Lock()
	defer l.runningMutex.Unlock()

	if l.running {
		return fmt.Errorf("服务已经在运行")
	}

	l.log("正在启动后端服务...")

	// 检查Node.js是否存在
	nodePath := l.config.NodePath
	if _, err := os.Stat(nodePath); os.IsNotExist(err) {
		return fmt.Errorf("找不到Node.js: %s", nodePath)
	}

	// 检查后端目录
	backendDir := l.config.BackendPath
	if _, err := os.Stat(backendDir); os.IsNotExist(err) {
		return fmt.Errorf("找不到后端目录: %s", backendDir)
	}

	// 启动后端服务
	mainFile := filepath.Join(backendDir, "dist", "main.js")
	if _, err := os.Stat(mainFile); os.IsNotExist(err) {
		// 尝试直接运行main.js
		mainFile = filepath.Join(backendDir, "main.js")
	}

	cmd := exec.Command(nodePath, mainFile)
	cmd.Dir = backendDir

	// 设置环境变量
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("PORT=%d", l.port),
		fmt.Sprintf("NODE_ENV=production"),
	)

	// 创建管道以捕获输出
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("创建stdout管道失败: %w", err)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("创建stderr管道失败: %w", err)
	}

	// 启动进程
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("启动后端服务失败: %w", err)
	}

	l.backendCmd = cmd
	l.running = true

	// 异步读取输出
	go l.readOutput(stdoutPipe, "INFO")
	go l.readOutput(stderrPipe, "ERROR")

	// 等待服务启动
	time.Sleep(2 * time.Second)

	// 检查服务是否启动成功
	if !l.isBackendRunning() {
		l.running = false
		return fmt.Errorf("后端服务启动失败")
	}

	l.log(fmt.Sprintf("后端服务启动成功，端口: %d", l.port))

	// 自动打开浏览器
	if l.config.AutoOpenBrowser {
		go l.openBrowser()
	}

	return nil
}

// readOutput 读取进程输出
func (l *Launcher) readOutput(pipe *os.File, prefix string) {
	scanner := bufio.NewScanner(pipe)
	for scanner.Scan() {
		line := scanner.Text()
		l.log(fmt.Sprintf("[%s] %s", prefix, line))
	}
}

// StopBackend 停止后端服务
func (l *Launcher) StopBackend() error {
	l.runningMutex.Lock()
	defer l.runningMutex.Unlock()

	if !l.running || l.backendCmd == nil {
		return nil
	}

	l.log("正在停止后端服务...")

	// 尝试优雅关闭
	if runtime.GOOS == "windows" {
		// Windows下使用taskkill
		exec.Command("taskkill", "/F", "/T", "/PID", strconv.Itoa(l.backendCmd.Process.Pid)).Run()
	} else {
		l.backendCmd.Process.Signal(os.Interrupt)
	}

	// 等待进程结束
	done := make(chan error, 1)
	go func() {
		done <- l.backendCmd.Wait()
	}()

	select {
	case <-time.After(10 * time.Second):
		l.backendCmd.Process.Kill()
	case <-done:
	}

	l.running = false
	l.backendCmd = nil
	l.log("后端服务已停止")

	return nil
}

// isBackendRunning 检查后端是否运行
func (l *Launcher) isBackendRunning() bool {
	if l.backendCmd == nil || l.backendCmd.Process == nil {
		return false
	}

	// 检查进程是否还在运行
	if err := l.backendCmd.Process.Signal(os.Signal(syscall(0))); err != nil {
		return false
	}

	// 尝试连接服务
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", l.port), 2*time.Second)
	if err != nil {
		return false
	}
	conn.Close()

	return true
}

// openBrowser 打开浏览器
func (l *Launcher) openBrowser() {
	url := fmt.Sprintf("http://127.0.0.1:%d", l.port)
	l.log(fmt.Sprintf("正在打开浏览器: %s", url))
	
	if err := open.Run(url); err != nil {
		l.log(fmt.Sprintf("打开浏览器失败: %v", err))
	}
}

// log 记录日志
func (l *Launcher) log(message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logLine := fmt.Sprintf("[%s] %s", timestamp, message)

	l.logMutex.Lock()
	l.logBuffer = append(l.logBuffer, logLine)
	// 保持日志缓冲区在合理大小
	if len(l.logBuffer) > 1000 {
		l.logBuffer = l.logBuffer[len(l.logBuffer)-500:]
	}
	l.logMutex.Unlock()

	// 打印到控制台
	fmt.Println(logLine)

	// 更新日志窗口
	if logWindow != nil {
		logWindow.AppendLog(logLine)
	}
}

// GetLogs 获取日志
func (l *Launcher) GetLogs() []string {
	l.logMutex.Lock()
	defer l.logMutex.Unlock()

	logs := make([]string, len(l.logBuffer))
	copy(logs, l.logBuffer)
	return logs
}

// onReady 系统托盘就绪回调
func (l *Launcher) onReady() {
	trayInstance = NewTrayIcon(l)
	trayInstance.Setup()
}

// onExit 系统托盘退出回调
func (l *Launcher) onExit() {
	l.StopBackend()
	close(l.quitChan)
}
