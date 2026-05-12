import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tabs,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  HistoryOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  BankOutlined,
  DollarOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { useWorldBuildingStore } from '../../stores/worldBuildingStore';
import { WorldBuilding } from '../../api/types';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const categoryConfig = {
  geography: { icon: <GlobalOutlined />, label: '地理', color: '#3498db' },
  history: { icon: <HistoryOutlined />, label: '历史', color: '#9b59b6' },
  culture: { icon: <TeamOutlined />, label: '文化', color: '#e67e22' },
  magic: { icon: <ThunderboltOutlined />, label: '力量体系', color: '#e74c3c' },
  technology: { icon: <BankOutlined />, label: '科技', color: '#1abc9c' },
  politics: { icon: <BankOutlined />, label: '政治', color: '#34495e' },
  economy: { icon: <DollarOutlined />, label: '经济', color: '#f1c40f' },
  other: { icon: <TagsOutlined />, label: '其他', color: '#95a5a6' },
};

export const WorldBuildingPage: React.FC = () => {
  const { items, loading, fetchList, create, update, delete: deleteItem, setCurrentItem } = useWorldBuildingStore();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WorldBuilding | null>(null);
  const [form] = Form.useForm();
  const [projectId] = useState('default-project');

  useEffect(() => {
    fetchList(projectId);
  }, [projectId]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.content.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: WorldBuilding) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条世界设定吗？',
      onOk: async () => {
        await deleteItem(id);
        message.success('删除成功');
      },
    });
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    if (editingItem) {
      await update(editingItem.id, values);
      message.success('更新成功');
    } else {
      await create({ ...values, projectId });
      message.success('创建成功');
    }
    setModalVisible(false);
  };

  return (
    <div className="world-building-page">
      <div className="page-header">
        <Title level={2}>世界设定</Title>
        <Paragraph type="secondary">构建小说世界观的基础设定</Paragraph>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="搜索设定..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建设定
            </Button>
          </Col>
        </Row>

        <Tabs activeKey={activeCategory} onChange={setActiveCategory}>
          <TabPane tab="全部" key="all" />
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabPane 
              tab={<span>{config.icon} {config.label}</span>} 
              key={key} 
            />
          ))}
        </Tabs>

        <Spin spinning={loading}>
          {filteredItems.length === 0 ? (
            <Empty description="暂无设定数据" />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredItems.map(item => {
                const config = categoryConfig[item.category] || categoryConfig.other;
                return (
                  <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
                    <Card
                      hoverable
                      className="setting-card"
                      actions={[
                        <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                        <DeleteOutlined key="delete" onClick={() => handleDelete(item.id)} />,
                      ]}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Tag color={config.color}>{config.icon} {config.label}</Tag>
                      </div>
                      <Title level={5} ellipsis>{item.name}</Title>
                      <Paragraph ellipsis={{ rows: 3 }} type="secondary">
                        {item.content}
                      </Paragraph>
                      {item.tags.length > 0 && (
                        <Space wrap>
                          {item.tags.slice(0, 3).map(tag => (
                            <Tag key={tag} style={{ margin: 0 }}>{tag}</Tag>
                          ))}
                          {item.tags.length > 3 && <Tag>+{item.tags.length - 3}</Tag>}
                        </Space>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Spin>
      </Card>

      <Modal
        title={editingItem ? '编辑设定' : '新建设定'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="设定名称" rules={[{ required: true }]}>
            <Input placeholder="请输入设定名称" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  {config.icon} {config.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="content" label="详细内容" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="请输入详细内容" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后按回车添加" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};