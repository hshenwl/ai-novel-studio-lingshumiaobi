import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, List, Tag, Button, Space, Avatar } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RightOutlined,
  PlusOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { Loading } from '../../components/common/Loading';

const { Title, Paragraph, Text } = Typography;

interface RecentActivity {
  id: string;
  type: 'chapter' | 'character' | 'world' | 'outline';
  title: string;
  time: string;
  projectId: string;
  projectName: string;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchProjects({ page: 1, pageSize: 100 } as any);
    fetchTasks('' as any);
  }, []);

  const quickActions = [
    { key: 'new-project', icon: <PlusOutlined />, label: '新建项目', path: '/projects' },
    { key: 'characters', icon: <UserOutlined />, label: '角色管理', path: '/characters' },
    { key: 'world', icon: <BookOutlined />, label: '世界设定', path: '/world-building' },
    { key: 'chapters', icon: <FileTextOutlined />, label: '章节管理', path: '/chapters' },
  ];

  const stats = {
    totalProjects: projects.length,
    totalWords: projects.reduce((sum, p) => sum + (p.currentWords || 0), 0),
    totalCharacters: 48,
    todayWords: 3500,
  };

  const currentProject = projects.find(p => p.status === 'writing') || projects[0];

  if (projectsLoading) {
    return <Loading tip="加载中..." />;
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <Title level={2}>工作台</Title>
        <Paragraph type="secondary">欢迎回来，这是您的创作工作台概览。</Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="项目总数"
              value={stats.totalProjects}
              prefix={<BookOutlined style={{ color: '#e74c3c' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="总字数"
              value={stats.totalWords}
              prefix={<FileTextOutlined style={{ color: '#27ae60' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="角色数"
              value={stats.totalCharacters}
              prefix={<UserOutlined style={{ color: '#3498db' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="今日产出"
              value={stats.todayWords}
              prefix={<ClockCircleOutlined style={{ color: '#f39c12' }} />}
              valueStyle={{ color: '#fff' }}
              suffix="字"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* 当前项目进度 */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <RocketOutlined style={{ color: '#e74c3c' }} />
                <span>当前项目进度</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => navigate('/projects')}>查看全部</Button>}
          >
            {currentProject ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Text strong style={{ fontSize: 16 }}>{currentProject.name}</Text>
                    <Tag color={currentProject.status === 'writing' ? 'processing' : 'default'}>
                      {currentProject.status === 'writing' ? '创作中' : '草稿'}
                    </Tag>
                  </Space>
                </div>
                <Progress 
                  percent={Math.round((currentProject.currentWords / currentProject.targetWords) * 100)} 
                  status="active"
                  strokeColor={{
                    '0%': '#e74c3c',
                    '100%': '#27ae60',
                  }}
                />
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Text type="secondary">目标字数</Text>
                    <br />
                    <Text strong>{currentProject.targetWords.toLocaleString()} 字</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">已完成</Text>
                    <br />
                    <Text strong style={{ color: '#27ae60' }}>{currentProject.currentWords.toLocaleString()} 字</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">类型</Text>
                    <br />
                    <Text strong>{currentProject.genre}</Text>
                  </Col>
                </Row>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Paragraph type="secondary">暂无项目，快去创建一个吧！</Paragraph>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects')}>
                  新建项目
                </Button>
              </div>
            )}
          </Card>
        </Col>

        {/* 快捷操作 */}
        <Col xs={24} lg={8}>
          <Card title="快捷操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              {quickActions.map(action => (
                <Button 
                  key={action.key}
                  type="text" 
                  block 
                  onClick={() => navigate(action.path)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#1f1f1f',
                    borderRadius: 8,
                  }}
                >
                  <Space>
                    {action.icon}
                    <span>{action.label}</span>
                  </Space>
                  <RightOutlined />
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card title="最近活动" extra={<Button type="link">查看全部</Button>}>
            <List
              dataSource={[
                { id: '1', type: 'chapter', title: '第三章 神秘的洞穴', time: '10分钟前', projectId: '1', projectName: '玄幻世界传说' },
                { id: '2', type: 'character', title: '添加角色：林月如', time: '1小时前', projectId: '1', projectName: '玄幻世界传说' },
                { id: '3', type: 'world', title: '更新世界设定：魔法体系', time: '2小时前', projectId: '1', projectName: '玄幻世界传说' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: item.type === 'chapter' ? '#e74c3c' : 
                                          item.type === 'character' ? '#3498db' : '#27ae60' 
                        }}
                        icon={
                          item.type === 'chapter' ? <FileTextOutlined /> :
                          item.type === 'character' ? <UserOutlined /> : <BookOutlined />
                        }
                      />
                    }
                    title={item.title}
                    description={<Text type="secondary">{item.projectName} · {item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 进行中的任务 */}
        <Col xs={24} lg={12}>
          <Card title="进行中的任务" extra={<Button type="link" onClick={() => navigate('/tasks')}>查看全部</Button>}>
            <List
              dataSource={[
                { id: '1', title: '生成第五章内容', progress: 75, status: 'running' },
                { id: '2', title: '角色关系分析', progress: 100, status: 'completed' },
                { id: '3', title: '章节润色优化', progress: 30, status: 'running' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.status === 'completed' ? 
                        <CheckCircleOutlined style={{ fontSize: 20, color: '#27ae60' }} /> :
                        <SyncOutlined spin style={{ fontSize: 20, color: '#e74c3c' }} />
                    }
                    title={item.title}
                    description={
                      <Progress 
                        percent={item.progress} 
                        size="small" 
                        status={item.status === 'completed' ? 'success' : 'active'}
                        strokeColor={item.status === 'completed' ? '#27ae60' : '#e74c3c'}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};