import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const VolumeOutlinePage: React.FC = () => {
  return (
    <Card>
      <Title level={3}>卷纲管理</Title>
      <Paragraph>管理小说各卷的大纲，定义每卷的主要剧情走向和章节规划。</Paragraph>
    </Card>
  );
};