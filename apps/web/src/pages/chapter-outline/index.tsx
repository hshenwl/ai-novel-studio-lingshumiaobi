import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const ChapterOutlinePage: React.FC = () => {
  return (
    <Card>
      <Title level={3}>章纲管理</Title>
      <Paragraph>管理各章节的大纲，定义每个章节的剧情点、角色登场、伏笔设置等。</Paragraph>
    </Card>
  );
};