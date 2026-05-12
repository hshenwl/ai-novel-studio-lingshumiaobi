package main

import (
	"os"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

// setConsoleTitle 设置控制台标题
func setConsoleTitle(title string) {
	kernel32 := windows.NewLazySystemDLL("kernel32.dll")
	setConsoleTitle := kernel32.NewProc("SetConsoleTitleW")
	setConsoleTitle.Call(uintptr(unsafe.Pointer(windows.StringToUTF16Ptr(title))))
}

// showError 显示错误对话框
func showError(title, message string) {
	user32 := windows.NewLazySystemDLL("user32.dll")
	messageBox := user32.NewProc("MessageBoxW")
	messageBox.Call(
		0,
		uintptr(unsafe.Pointer(windows.StringToUTF16Ptr(message))),
		uintptr(unsafe.Pointer(windows.StringToUTF16Ptr(title))),
		uintptr(0x10), // MB_ICONERROR
	)
}

// openFile 打开文件
func openFile(path string) (*os.File, error) {
	pathPtr, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return nil, err
	}

	handle, err := windows.CreateFile(
		pathPtr,
		windows.GENERIC_READ,
		windows.FILE_SHARE_READ,
		nil,
		windows.OPEN_EXISTING,
		windows.FILE_ATTRIBUTE_NORMAL,
		0,
	)
	if err != nil {
		return nil, err
	}

	return os.NewFile(uintptr(handle), path), nil
}

// createFile 创建文件
func createFile(path string) (*os.File, error) {
	pathPtr, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return nil, err
	}

	handle, err := windows.CreateFile(
		pathPtr,
		windows.GENERIC_WRITE,
		0,
		nil,
		windows.CREATE_ALWAYS,
		windows.FILE_ATTRIBUTE_NORMAL,
		0,
	)
	if err != nil {
		return nil, err
	}

	return os.NewFile(uintptr(handle), path), nil
}
