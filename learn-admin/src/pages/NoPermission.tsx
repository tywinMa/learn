import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface NoPermissionProps {
  message?: string;
}

const NoPermission: React.FC<NoPermissionProps> = ({ message = '您没有权限访问此页面' }) => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="没有权限"
      subTitle={message}
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          返回首页
        </Button>
      }
    />
  );
};

export default NoPermission; 