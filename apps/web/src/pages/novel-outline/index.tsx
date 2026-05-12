import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const NovelOutlinePage: React.FC = () => {
  return (
    <Card>
      <Title level={3}>小说总纲</Title>
      <Paragraph>编辑小说的整体大纲，包括核心设定、主线剧情、主题思想等。</Paragraph>
    </Card>
  );
};