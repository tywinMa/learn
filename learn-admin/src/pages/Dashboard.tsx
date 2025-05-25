import React from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Divider } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  // 模拟数据，实际中应该从API获取
  const stats = {
    totalCourses: 24,
    totalStudents: 358,
    activeCourses: 12,
    completionRate: 85,
  };

  // 模拟最近活动数据
  const recentActivities = [
    { id: 1, title: "Java编程基础课程已上线", time: "2小时前" },
    { id: 2, title: "Web前端开发课程完成更新", time: "3小时前" },
    { id: 3, title: "数据结构与算法课程添加新章节", time: "1天前" },
    { id: 4, title: "移动应用开发课程发布作业", time: "2天前" },
  ];

  // 模拟热门课程数据
  const popularCourses = [
    { id: 1, title: "Java编程基础", students: 120, progress: 85 },
    { id: 2, title: "Web前端开发", students: 98, progress: 72 },
    { id: 3, title: "Python数据分析", students: 76, progress: 63 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold m-0">仪表盘概览</h1>
        <div className="text-sm text-gray-500">今日: {new Date().toLocaleDateString()}</div>
      </div>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title={<span className="text-gray-600">总课程数</span>}
              value={stats.totalCourses}
              prefix={<BookOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ color: '#1677ff', fontWeight: 'bold' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              <RiseOutlined /> 较上月增长 8%
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title={<span className="text-gray-600">学生总数</span>}
              value={stats.totalStudents}
              prefix={<TeamOutlined className="text-green-500 mr-1" />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              <RiseOutlined /> 较上月增长 12%
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title={<span className="text-gray-600">进行中课程</span>}
              value={stats.activeCourses}
              prefix={<ClockCircleOutlined className="text-amber-500 mr-1" />}
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              <RiseOutlined /> 较上月增长 3%
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title={<span className="text-gray-600">课程完成率</span>}
              value={stats.completionRate}
              prefix={<TrophyOutlined className="text-red-500 mr-1" />}
              suffix="%"
              valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              <RiseOutlined /> 较上月增长 5%
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={16}>
          <Card 
            title={<span className="text-lg font-medium">热门课程</span>}
            className="shadow-sm h-auto"
            extra={<a href="/courses" className="text-primary text-sm">查看全部</a>}
          >
            <List
              dataSource={popularCourses}
              renderItem={item => (
                <List.Item key={item.id}>
                  <div className="w-full">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.students} 名学生</div>
                    </div>
                    <Progress percent={item.progress} size="small" status="active" />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-lg font-medium">最近活动</span>}
            className="shadow-sm h-auto"
            extra={<a href="#" className="text-primary text-sm">查看全部</a>}
          >
            <List
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} style={{ backgroundColor: '#1677ff' }} />}
                    title={item.title}
                    description={<span className="text-xs text-gray-400">{item.time}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card 
            title={<span className="text-lg font-medium">学习进度统计</span>}
            className="shadow-sm h-auto"
          >
            <div className="flex flex-wrap justify-around items-center">
              <div className="text-center p-4">
                <Progress type="circle" percent={75} width={120} status="active" />
                <div className="mt-3 font-medium">整体学习进度</div>
              </div>
              <Divider type="vertical" className="h-24" />
              <div className="text-center p-4">
                <Progress type="circle" percent={85} width={120} strokeColor="#52c41a" />
                <div className="mt-3 font-medium">作业提交率</div>
              </div>
              <Divider type="vertical" className="h-24" />
              <div className="text-center p-4">
                <Progress type="circle" percent={60} width={120} strokeColor="#faad14" />
                <div className="mt-3 font-medium">考试通过率</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 