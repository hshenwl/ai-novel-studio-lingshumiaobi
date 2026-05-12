import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { projectService } from '../../api/services/project';
import { Project, CreateProjectRequest } from '../../api/types';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'genre',
      key: 'genre',
    },
    {
      title: '目标字数',
      dataIndex: 'targetWords',
      key: 'targetWords',
      render: (value: number) => `${value.toLocaleString()}字`,
    },
    {
      title: '当前字数',
      dataIndex: 'currentWords',
      key: 'currentWords',
      render: (value: number) => `${value.toLocaleString()}字`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          draft: 'default',
          writing: 'processing',
          completed: 'success',
          paused: 'warning',
        };
        const labels = {
          draft: '草稿',
          writing: '创作中',
          completed: '已完成',
          paused: '暂停',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/novel-outline?projectId=${record.id}`)}>
            进入
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
          <Button type="link" icon={<ExportOutlined />} onClick={() => handleExport(record.id)}>
            导出
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getList({ page: 1, pageSize: 100 });
      if (res.code === 0) {
        setProjects(res.data.list);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (project: Project) => {
    form.setFieldsValue(project);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据无法恢复，确定要删除这个项目吗？',
      onOk: async () => {
        await projectService.delete(id);
        loadProjects();
      },
    });
  };

  const handleExport = async (id: string) => {
    // TODO: 实现导出功能
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    await projectService.create(values as CreateProjectRequest);
    setModalVisible(false);
    loadProjects();
  };

  return (
    <div className="projects-page">
      <Card>
        <Title level={3}>项目管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
          新建项目
        </Button>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="新建项目"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="genre" label="小说类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'fantasy', label: '玄幻' },
                { value: 'urban', label: '都市' },
                { value: 'romance', label: '言情' },
                { value: 'scifi', label: '科幻' },
                { value: 'mystery', label: '悬疑' },
                { value: 'history', label: '历史' },
              ]}
            />
          </Form.Item>
          <Form.Item name="targetWords" label="目标字数" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};