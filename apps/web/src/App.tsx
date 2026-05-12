import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/home';
import { ProjectsPage } from './pages/projects';
import { WorldBuildingPage } from './pages/world-building';
import { NovelOutlinePage } from './pages/novel-outline';
import { VolumeOutlinePage } from './pages/volume-outline';
import { ChapterOutlinePage } from './pages/chapter-outline';
import { ChaptersPage } from './pages/chapters';
import { WorkflowPage } from './pages/workflow';
import { CharactersPage } from './pages/characters';
import { OrganizationsPage } from './pages/organizations';
import { ProfessionsPage } from './pages/professions';
import { RelationsPage } from './pages/relations';
import { ForeshadowingPage } from './pages/foreshadowing';
import { HooksPage } from './pages/hooks';
import { WritingStylePage } from './pages/writing-style';
import { AIPolishPage } from './pages/ai-polish';
import { KnowledgeBasePage } from './pages/knowledge-base';
import { ModelConfigPage } from './pages/model-config';
import { TasksPage } from './pages/tasks';
import { LogsPage } from './pages/logs';
import { SettingsPage } from './pages/settings';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './App.css';

// 番茄风配色主题
const customTheme = {
  token: {
    colorPrimary: '#e74c3c', // 番茄红 - 主色
    colorSuccess: '#27ae60', // 番茄绿 - 成功色
    colorWarning: '#f39c12', // 番茄橙 - 警告色
    colorError: '#c0392b',   // 深番茄红 - 错误色
    colorInfo: '#3498db',    // 信息色
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Menu: {
      itemBg: '#1a1a1a',
      itemSelectedBg: '#2d2d2d',
      itemHoverBg: '#252525',
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      headerBg: '#2d2d2d',
      rowHoverBg: '#252525',
    },
  },
};

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider 
        theme={{
          ...customTheme,
          algorithm: theme.darkAlgorithm,
        }}
        locale={zhCN}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route element={<MainLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/world-building" element={<WorldBuildingPage />} />
              <Route path="/novel-outline" element={<NovelOutlinePage />} />
              <Route path="/volume-outline" element={<VolumeOutlinePage />} />
              <Route path="/chapter-outline" element={<ChapterOutlinePage />} />
              <Route path="/chapters" element={<ChaptersPage />} />
              <Route path="/workflow" element={<WorkflowPage />} />
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/professions" element={<ProfessionsPage />} />
              <Route path="/relations" element={<RelationsPage />} />
              <Route path="/foreshadowing" element={<ForeshadowingPage />} />
              <Route path="/hooks" element={<HooksPage />} />
              <Route path="/writing-style" element={<WritingStylePage />} />
              <Route path="/ai-polish" element={<AIPolishPage />} />
              <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="/model-config" element={<ModelConfigPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;