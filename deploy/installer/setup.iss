; AI Novel Studio Installation Script
; Inno Setup 6.x

#define AppName "AI Novel Studio"
#define AppVersion "1.0.0"
#define AppPublisher "AI Novel Studio Team"
#define AppURL "https://github.com/ai-novel-studio"
#define AppExeName "launcher.exe"
#define AppGuid "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}"

[Setup]
; 应用信息
AppId={#AppGuid}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}/support
AppUpdatesURL={#AppURL}/releases

; 默认安装路径
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}

; 输出设置
OutputDir=..\..\dist\installer
OutputBaseFilename=ai-novel-studio-{#AppVersion}-setup
SetupIconFile=..\..\resources\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; 权限
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; 界面
WizardStyle=modern
SetupWindowTitle={#AppName} 安装向导
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}

; 许可证和文档
LicenseFile=..\..\LICENSE
InfoBeforeFile=..\..\README.md

; 架构
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; 其他选项
DisableDirPage=no
DisableProgramGroupPage=no
DisableStartPage=yes
CreateAppDir=yes
AllowNoIcons=yes
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
chinesesimplified.BeveledLabel={#AppName} 安装程序
chinesesimplified.WelcomeLabel1=欢迎使用 {#AppName} 安装向导
chinesesimplified.WelcomeLabel2=这将安装 {#AppName} 到您的计算机。%n%n建议您在继续之前关闭所有其他应用程序。
chinesesimplified.FinishedHeadingLabel={#AppName} 安装完成
chinesesimplified.FinishedLabel=安装程序已完成 {#AppName} 的安装。%n%n您现在可以运行应用程序。
chinesesimplified.ClickFinish=点击"完成"退出安装程序并启动 {#AppName}。

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associatenovelfile"; Description: "关联 .novel 文件"; GroupDescription: "文件关联:"; Flags: checkedonce

[Files]
; 启动器
Source: "..\..\dist\launcher.exe"; DestDir: "{app}"; Flags: ignoreversion

; Node.js 运行时（嵌入式）
Source: "..\..\dist\nodejs\*"; DestDir: "{app}\nodejs"; Flags: ignoreversion recursesubdirs createallsubdirs

; 前端静态文件
Source: "..\..\dist\frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs

; 后端代码
Source: "..\..\dist\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs

; 知识库文件
Source: "..\..\knowledge\*"; DestDir: "{app}\knowledge"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; Agent规则文件
Source: "..\..\config\agents\*"; DestDir: "{app}\config\agents"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; Prompt模板
Source: "..\..\resources\prompts\*"; DestDir: "{app}\resources\prompts"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; 配置文件模板
Source: "..\..\config\*.json"; DestDir: "{app}\config"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\..\.env.example"; DestDir: "{app}"; DestName: ".env.example"; Flags: ignoreversion

; 资源文件
Source: "..\..\resources\icon.ico"; DestDir: "{app}\assets"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\..\resources\*"; DestDir: "{app}\resources"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; 文档
Source: "..\..\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "..\..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Dirs]
Name: "{app}\logs"; Permissions: users-modify
Name: "{app}\data"; Permissions: users-modify
Name: "{app}\cache"; Permissions: users-modify
Name: "{app}\temp"; Permissions: users-modify
Name: "{app}\workspace"; Permissions: users-modify
Name: "{app}\output"; Permissions: users-modify

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: quicklaunchicon

[Registry]
; 应用注册
Root: HKCU; Subkey: "Software\{#AppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"
Root: HKCU; Subkey: "Software\{#AppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#AppVersion}"

; 文件关联
Root: HKCR; Subkey: ".novel"; ValueType: string; ValueName: ""; ValueData: "{#AppName}Project"; Tasks: associatenovelfile
Root: HKCR; Subkey: "{#AppName}Project"; ValueType: string; ValueName: ""; ValueData: "{#AppName} Project File"; Tasks: associatenovelfile
Root: HKCR; Subkey: "{#AppName}Project\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\assets\icon.ico,0"; Tasks: associatenovelfile
Root: HKCR; Subkey: "{#AppName}Project\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#AppExeName}"" ""%1"""; Tasks: associatenovelfile

[Run]
; 安装完成后运行
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; 卸载前停止服务
Filename: "{app}\{#AppExeName}"; Parameters: "--stop"; Flags: runhidden waituntilterminated

[UninstallDelete]
; 卸载时删除文件
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\cache"
Type: filesandordirs; Name: "{app}\temp"
Type: filesandordirs; Name: "{app}\nodejs"
Type: filesandordirs; Name: "{app}"

[Code]
// 检查是否已安装
function InitializeSetup(): Boolean;
var
  OldVersion: String;
  UninstallPath: String;
  ErrorCode: Integer;
begin
  // 检查是否已安装
  if RegQueryStringValue(HKEY_LOCAL_MACHINE,
    'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#AppGuid}_is1',
    'UninstallString', UninstallPath) then
  begin
    UninstallPath := RemoveQuotes(UninstallPath);
    if MsgBox('检测到已安装 {#AppName}，是否先卸载旧版本？', mbConfirmation, MB_YESNO) = IDYES then
    begin
      UninstallPath := ExtractFilePath(UninstallPath);
      ShellExec('', UninstallPath + 'unins000.exe', '/SILENT', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
    end;
  end;
  Result := True;
end;

// 安装完成后创建首次启动引导
procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigPath: String;
begin
  if CurStep = ssPostInstall then
  begin
    // 创建配置文件
    ConfigPath := ExpandConstant('{app}\launcher.json');
    if not FileExists(ConfigPath) then
    begin
      SaveStringToFile(ConfigPath,
        '{' + #13#10 +
        '  "defaultPort": 18765,' + #13#10 +
        '  "minPort": 18765,' + #13#10 +
        '  "maxPort": 18775,' + #13#10 +
        '  "backendPath": "backend",' + #13#10 +
        '  "frontendPath": "frontend",' + #13#10 +
        '  "nodePath": "nodejs/node.exe",' + #13#10 +
        '  "autoOpenBrowser": true,' + #13#10 +
        '  "enableLogWindow": true,' + #13#10 +
        '  "trayIconPath": "assets/icon.ico"' + #13#10 +
        '}', False);
    end;
    
    // 创建.env文件（如果不存在）
    if not FileExists(ExpandConstant('{app}\.env')) then
    begin
      FileCopy(ExpandConstant('{app}\.env.example'), ExpandConstant('{app}\.env'), False);
    end;
  end;
end;

// 卸载时询问是否保留数据
function InitializeUninstall(): Boolean;
begin
  if MsgBox('是否删除应用数据（包括工作区、知识库等）？', mbConfirmation, MB_YESNO) = IDYES then
  begin
    // 删除数据目录
    DelTree(ExpandConstant('{app}\data'), True, True, True);
    DelTree(ExpandConstant('{app}\workspace'), True, True, True);
    DelTree(ExpandConstant('{app}\knowledge'), True, True, True);
    DelTree(ExpandConstant('{app}\output'), True, True, True);
  end;
  Result := True;
end;
