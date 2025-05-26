import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Typography } from 'antd';

const { Title, Text } = Typography;

const TestProgress: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string, title: string) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        setData({ title, data: result });
        message.success(`${title} API 测试成功`);
      } else {
        message.error(`${title} API 测试失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`${title} API 测试失败:`, error);
      message.error(`${title} API 测试失败`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>学生进度API测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="API测试">
          <Space wrap>
            <Button 
              loading={loading}
              onClick={() => testAPI('/api/admin/users', '获取学生列表')}
            >
              测试学生列表API
            </Button>
            <Button 
              loading={loading}
              onClick={() => testAPI('/api/admin/users/1/progress-overview', '学生进度概览')}
            >
              测试进度概览API (学生ID: 1)
            </Button>
            <Button 
              loading={loading}
              onClick={() => testAPI('/api/admin/users/1/wrong-exercises', '错题分析')}
            >
              测试错题分析API (学生ID: 1)
            </Button>
            <Button 
              loading={loading}
              onClick={() => testAPI('/api/admin/users/1/time-analysis', '时间分析')}
            >
              测试时间分析API (学生ID: 1)
            </Button>
          </Space>
        </Card>

        {data && (
          <Card title={`API响应: ${data.title}`}>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              overflow: 'auto',
              maxHeight: 400
            }}>
              {JSON.stringify(data.data, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default TestProgress; 