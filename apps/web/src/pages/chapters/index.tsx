import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const ChaptersPage: React.FC = () => {
  return (
    <Card>
      <Title level={3}>章节管理</Title>
      <Paragraph>管理所有章节内容，支持编辑、AI生成、润色等功能。</Paragraph>
    </Card>
  );
};