package main

import (
	"fmt"

	"github.com/getlantern/systray"
)

// TrayIcon 系统托盘图标
type TrayIcon struct {
	launcher *Launcher

	// 菜单项
	mOpen     *systray.MenuItem
	mStatus   *systray.MenuItem
	mStart    *systray.MenuItem
	mStop     *systray.MenuItem
	mLogs     *systray.MenuItem
	mQuit     *systray.MenuItem
}

// NewTrayIcon 创建新的托盘图标
func NewTrayIcon(launcher *Launcher) *TrayIcon {
	return &TrayIcon{
		launcher: launcher,
	}
}

// Setup 设置托盘图标
func (t *TrayIcon) Setup() {
	// 设置托盘图标
	systray.SetIcon(t.getIcon())
	systray.SetTitle("AI Novel Studio")
	systray.SetTooltip("AI Novel Studio Launcher")

	// 创建菜单项
	t.mOpen = systray.AddMenuItem("打开界面", "在浏览器中打开应用界面")
	t.mStatus = systray.AddMenuItem("状态: 已停止", "服务状态")
	t.mStatus.Disable()
	
	systray.AddSeparator()
	
	t.mStart = systray.AddMenuItem("启动服务", "启动后端服务")
	t.mStop = systray.AddMenuItem("停止服务", "停止后端服务")
	t.mStop.Disable()
	
	systray.AddSeparator()
	
	t.mLogs = systray.AddMenuItem("查看日志", "打开日志窗口")
	
	systray.AddSeparator()
	
	t.mQuit = systray.AddMenuItem("退出", "退出应用程序")

	// 监听菜单事件
	go t.handleEvents()
	
	// 启动后端服务
	go t.autoStart()
}

// getIcon 获取托盘图标
func (t *TrayIcon) getIcon() []byte {
	// 尝试从文件加载图标
	if t.launcher.config.TrayIconPath != "" {
		if data, err := readFile(t.launcher.config.TrayIconPath); err == nil {
			return data
		}
	}

	// 使用默认图标（简单的ICO数据）
	return getDefaultIcon()
}

// handleEvents 处理菜单事件
func (t *TrayIcon) handleEvents() {
	for {
		select {
		case <-t.mOpen.ClickedCh:
			t.launcher.openBrowser()

		case <-t.mStart.ClickedCh:
			t.startBackend()

		case <-t.mStop.ClickedCh:
			t.stopBackend()

		case <-t.mLogs.ClickedCh:
			if logWindow != nil {
				go logWindow.Show()
			}

		case <-t.mQuit.ClickedCh:
			t.quit()

		case <-t.launcher.quitChan:
			return
		}
	}
}

// autoStart 自动启动服务
func (t *TrayIcon) autoStart() {
	// 等待托盘图标完全加载
	// time.Sleep(500 * time.Millisecond)
	
	// 自动启动后端
	t.startBackend()
}

// startBackend 启动后端服务
func (t *TrayIcon) startBackend() {
	if err := t.launcher.StartBackend(); err != nil {
		t.updateStatus(false)
		showError("启动失败", err.Error())
		return
	}
	
	t.updateStatus(true)
}

// stopBackend 停止后端服务
func (t *TrayIcon) stopBackend() {
	if err := t.launcher.StopBackend(); err != nil {
		showError("停止失败", err.Error())
		return
	}
	
	t.updateStatus(false)
}

// updateStatus 更新状态显示
func (t *TrayIcon) updateStatus(running bool) {
	if running {
		t.mStatus.SetTitle(fmt.Sprintf("状态: 运行中 (端口 %d)", t.launcher.port))
		t.mStart.Disable()
		t.mStop.Enable()
	} else {
		t.mStatus.SetTitle("状态: 已停止")
		t.mStart.Enable()
		t.mStop.Disable()
	}
}

// quit 退出应用
func (t *TrayIcon) quit() {
	t.launcher.StopBackend()
	systray.Quit()
}

// getDefaultIcon 获取默认图标
func getDefaultIcon() []byte {
	// 简单的16x16 ICO文件（蓝色圆形）
	return []byte{
		0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
		0x20, 0x00, 0x68, 0x04, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
		0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00,
		0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00,
	}
}

// readFile 读取文件
func readFile(path string) ([]byte, error) {
	file, err := openFile(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return nil, err
	}

	data := make([]byte, stat.Size())
	_, err = file.Read(data)
	if err != nil {
		return nil, err
	}

	return data, nil
}
