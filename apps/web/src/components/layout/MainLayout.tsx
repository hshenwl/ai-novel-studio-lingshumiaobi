import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Switch } from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  GlobalOutlined,
  BookOutlined,
  FolderOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  UserOutlined,
  TeamOutlined,
  SolutionOutlined,
  NodeIndexOutlined,
  BulbOutlined,
  LinkOutlined,
  HighlightOutlined,
  ToolOutlined,
  DatabaseOutlined,
  ScheduleOutlined,
  FileSearchOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';
import './MainLayout.css';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: '工作台' },
  { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
  { type: 'divider' as const, key: 'divider-1' },
  { key: '/world-building', icon: <GlobalOutlined />, label: '世界设定' },
  { key: '/novel-outline', icon: <BookOutlined />, label: '小说总纲' },
  { key: '/volume-outline', icon: <FolderOutlined />, label: '卷纲管理' },
  { key: '/chapter-outline', icon: <FileTextOutlined />, label: '章纲管理' },
  { key: '/chapters', icon: <OrderedListOutlined />, label: '章节管理' },
  { key: '/workflow', icon: <ToolOutlined />, label: '工作流监控' },
  { type: 'divider' as const, key: 'divider-2' },
  { key: '/characters', icon: <UserOutlined />, label: '角色管理' },
  { key: '/organizations', icon: <TeamOutlined />, label: '组织管理' },
  { key: '/professions', icon: <SolutionOutlined />, label: '职业管理' },
  { key: '/relations', icon: <NodeIndexOutlined />, label: '关系图谱' },
  { type: 'divider' as const, key: 'divider-3' },
  { key: '/foreshadowing', icon: <BulbOutlined />, label: '伏笔管理' },
  { key: '/hooks', icon: <LinkOutlined />, label: 'Hook管理' },
  { key: '/writing-style', icon: <HighlightOutlined />, label: '写作风格' },
  { key: '/ai-polish', icon: <ToolOutlined />, label: 'AI去味' },
  { type: 'divider' as const, key: 'divider-4' },
  { key: '/knowledge-base', icon: <DatabaseOutlined />, label: '知识库' },
  { key: '/tasks', icon: <ScheduleOutlined />, label: '任务中心' },
  { key: '/logs', icon: <FileSearchOutlined />, label: '日志中心' },
  { key: '/model-config', icon: <SettingOutlined />, label: '模型配置' },
];

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const [darkMode, setDarkMode] = React.useState(true);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <Layout className="main-layout">
      <Sider width={220} className="main-sider" theme="dark">
        <div className="logo">
          <BookOutlined style={{ fontSize: 24, marginRight: 8, color: '#e74c3c' }} />
          <span>AI小说创作系统</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="main-menu"
          theme="dark"
        />
      </Sider>
      <Layout className="content-layout">
        <Header className="main-header">
          <div className="header-left">
            <Text style={{ color: '#fff', fontSize: 16 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'AI小说创作'}
            </Text>
          </div>
          <div className="header-right">
            <Space size="middle">
              <Switch
                checked={darkMode}
                onChange={setDarkMode}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
              <BellOutlined style={{ fontSize: 18, color: '#fff', cursor: 'pointer' }} />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    style={{ backgroundColor: '#e74c3c' }} 
                    icon={<UserOutlined />} 
                  />
                  <Text style={{ color: '#fff' }}>{user?.name || '创作者'}</Text>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};