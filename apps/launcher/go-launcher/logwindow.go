package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// LogWindow 日志窗口（简化版本，使用外部日志查看器）
type LogWindow struct {
	launcher  *Launcher
	mu        sync.Mutex
	visible   bool
	logFile   *os.File
}

// NewLogWindow 创建新的日志窗口
func NewLogWindow(launcher *Launcher) *LogWindow {
	lw := &LogWindow{
		launcher: launcher,
	}

	// 创建日志文件
	logPath := filepath.Join(filepath.Dir(launcher.config.BackendPath), "logs", "launcher.log")
	os.MkdirAll(filepath.Dir(logPath), 0755)
	
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err == nil {
		lw.logFile = file
	}

	return lw
}

// Show 显示日志窗口（使用外部编辑器或记事本）
func (lw *LogWindow) Show() error {
	lw.mu.Lock()
	if lw.visible {
		lw.mu.Unlock()
		return nil
	}
	lw.visible = true
	lw.mu.Unlock()

	// 使用记事本打开日志文件
	logPath := filepath.Join(filepath.Dir(lw.launcher.config.BackendPath), "logs", "launcher.log")
	
	cmd := exec.Command("notepad.exe", logPath)
	err := cmd.Start()
	
	// 等待进程结束后重置visible状态
	go func() {
		cmd.Wait()
		lw.mu.Lock()
		lw.visible = false
		lw.mu.Unlock()
	}()

	return err
}

// AppendLog 追加日志
func (lw *LogWindow) AppendLog(message string) {
	lw.mu.Lock()
	defer lw.mu.Unlock()

	// 写入日志文件
	if lw.logFile != nil {
		lw.logFile.WriteString(message + "\n")
	}
}

// exportLogs 导出日志
func (lw *LogWindow) exportLogs() {
	// 导出日志到用户指定位置
	exportPath := filepath.Join(filepath.Dir(lw.launcher.config.BackendPath), "logs", 
		fmt.Sprintf("export-%s.log", time.Now().Format("20060102-150405")))
	
	logs := lw.launcher.GetLogs()
	data := []byte(strings.Join(logs, "\n"))
	
	os.WriteFile(exportPath, data, 0644)
}

// Close 关闭日志窗口
func (lw *LogWindow) Close() {
	lw.mu.Lock()
	defer lw.mu.Unlock()
	
	if lw.logFile != nil {
		lw.logFile.Close()
		lw.logFile = nil
	}
	lw.visible = false
}