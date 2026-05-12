import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
  tip?: string;
  fullScreen?: boolean;
  size?: 'small' | 'default' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ 
  tip = '加载中...', 
  fullScreen = false,
  size = 'default'
}) => {
  const loadingIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24, color: '#e74c3c' }} spin />;

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#141414'
      }}>
        <Spin indicator={loadingIcon} tip={tip} size={size}>
          <div style={{ padding: 50 }} />
        </Spin>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '50px 0'
    }}>
      <Spin indicator={loadingIcon} tip={tip} size={size} />
    </div>
  );
};