import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Progress, 
  Table, 
  Tabs, 
  Statistic, 
  Tag, 
  Button, 
  DatePicker, 
  Select,
  Space,
  Spin,
  message,
  Typography,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, 
  BookOutlined, 
  ClockCircleOutlined, 
  TrophyOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface CourseProgress {
  courseId: string;
  courseName: string;
  subjectName: string;
  totalUnits: number;
  completedUnits: number;
  totalStars: number;
  maxStars: number;
  totalTimeSpent: number;
  masteryLevel: number;
  progressPercentage: number;
  units: UnitProgress[];
}

interface UnitProgress {
  unitId: string;
  unitName: string;
  completed: boolean;
  stars: number;
  masteryLevel: number;
  totalTimeSpent: number;
  correctCount: number;
  incorrectCount: number;
}

interface WrongExercise {
  Exercise: {
    id: string;
    question: string;
    type: string;
    options: any;
    correctAnswer: any;
  };
  Course: {
    id: string;
    title: string;
  };
  errorCount: number;
  averageResponseTime: number;
  lastErrorTime: string;
  errorTypes: string[];
  userAnswers: any[];
}

interface TimeAnalysis {
  dailyStats: any[];
  hourlyStats: any[];
  weeklyStats: any[];
  courseTimeStats: any[];
}

const StudentProgress: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<{
    student: any;
    courseProgress: CourseProgress[];
  } | null>(null);
  const [wrongExercises, setWrongExercises] = useState<WrongExercise[]>([]);
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // 获取学生进度概览
  const fetchProgressOverview = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/progress-overview`);
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      } else {
        message.error('获取学生进度失败');
      }
    } catch (error) {
      console.error('获取学生进度失败:', error);
      message.error('获取学生进度失败');
    }
  };

  // 获取错题分析
  const fetchWrongExercises = async (courseId?: string) => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      
      const response = await fetch(`/api/admin/users/${userId}/wrong-exercises?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWrongExercises(data.exerciseErrorStats || []);
      } else {
        message.error('获取错题分析失败');
      }
    } catch (error) {
      console.error('获取错题分析失败:', error);
      message.error('获取错题分析失败');
    }
  };

  // 获取时间分析
  const fetchTimeAnalysis = async (courseId?: string, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/admin/users/${userId}/time-analysis?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTimeAnalysis(data);
      } else {
        message.error('获取时间分析失败');
      }
    } catch (error) {
      console.error('获取时间分析失败:', error);
      message.error('获取时间分析失败');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProgressOverview(),
        fetchWrongExercises(),
        fetchTimeAnalysis()
      ]);
      setLoading(false);
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  // 处理课程筛选
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    fetchWrongExercises(courseId || undefined);
    
    const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
    const endDate = dateRange?.[1]?.format('YYYY-MM-DD');
    fetchTimeAnalysis(courseId || undefined, startDate, endDate);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    const startDate = dates?.[0]?.format('YYYY-MM-DD');
    const endDate = dates?.[1]?.format('YYYY-MM-DD');
    fetchTimeAnalysis(selectedCourse || undefined, startDate, endDate);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 错题表格列定义
  const wrongExerciseColumns: ColumnsType<WrongExercise> = [
    {
      title: '题目',
      dataIndex: ['Exercise', 'question'],
      key: 'question',
      width: 200,
      ellipsis: true,
    },
    {
      title: '课程',
      dataIndex: ['Course', 'title'],
      key: 'courseName',
      width: 120,
    },
    {
      title: '题目类型',
      dataIndex: ['Exercise', 'type'],
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          'choice': '选择题',
          'fill_blank': '填空题',
          'matching': '匹配题',
          'true_false': '判断题'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '错误次数',
      dataIndex: 'errorCount',
      key: 'errorCount',
      width: 100,
      sorter: (a, b) => a.errorCount - b.errorCount,
      render: (count: number) => (
        <Tag color={count > 3 ? 'red' : count > 1 ? 'orange' : 'blue'}>
          {count}次
        </Tag>
      )
    },
    {
      title: '平均响应时间',
      dataIndex: 'averageResponseTime',
      key: 'averageResponseTime',
      width: 120,
      sorter: (a, b) => a.averageResponseTime - b.averageResponseTime,
      render: (time: number) => formatTime(Math.round(time))
    },
    {
      title: '错误类型',
      dataIndex: 'errorTypes',
      key: 'errorTypes',
      width: 120,
      render: (types: string[]) => (
        <Space wrap>
          {types.map(type => {
            const typeMap: { [key: string]: { text: string; color: string } } = {
              'calculation': { text: '计算错误', color: 'red' },
              'concept': { text: '概念错误', color: 'orange' },
              'careless': { text: '粗心错误', color: 'blue' },
              'unknown': { text: '未知', color: 'gray' }
            };
            const typeInfo = typeMap[type] || { text: type, color: 'gray' };
            return (
              <Tag key={type} color={typeInfo.color}>
                {typeInfo.text}
              </Tag>
            );
          })}
        </Space>
      )
    },
    {
      title: '最后错误时间',
      dataIndex: 'lastErrorTime',
      key: 'lastErrorTime',
      width: 150,
      sorter: (a, b) => new Date(a.lastErrorTime).getTime() - new Date(b.lastErrorTime).getTime(),
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!progressData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text>未找到学生数据</Text>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <BookOutlined />
          学习概览
        </span>
      ),
      children: (
        <div>
          {/* 总体统计 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总课程数"
                  value={progressData.courseProgress.length}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总学习时间"
                  value={formatTime(progressData.courseProgress.reduce((sum, course) => sum + course.totalTimeSpent, 0))}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="获得星星"
                  value={progressData.courseProgress.reduce((sum, course) => sum + course.totalStars, 0)}
                  suffix={`/ ${progressData.courseProgress.reduce((sum, course) => sum + course.maxStars, 0)}`}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均掌握度"
                  value={Math.round(progressData.courseProgress.reduce((sum, course) => sum + course.masteryLevel, 0) / progressData.courseProgress.length * 100)}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 课程进度详情 */}
          <Row gutter={[16, 16]}>
            {progressData.courseProgress.map(course => (
              <Col span={12} key={course.courseId}>
                <Card
                  title={
                    <div>
                      <Text strong>{course.courseName}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {course.subjectName}
                      </Text>
                    </div>
                  }
                  extra={
                    <Tooltip title={`掌握度: ${Math.round(course.masteryLevel * 100)}%`}>
                      <Progress
                        type="circle"
                        size={60}
                        percent={Math.round(course.masteryLevel * 100)}
                        format={() => `${Math.round(course.masteryLevel * 100)}%`}
                      />
                    </Tooltip>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="完成进度"
                        value={course.progressPercentage}
                        suffix="%"
                        precision={1}
                      />
                      <Progress 
                        percent={course.progressPercentage} 
                        size="small" 
                        style={{ marginTop: 8 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="学习时间"
                        value={formatTime(course.totalTimeSpent)}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          星星: {course.totalStars}/{course.maxStars}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'wrong-exercises',
      label: (
        <span>
          <ExclamationCircleOutlined />
          错题分析
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Text>筛选课程:</Text>
              <Select
                style={{ width: 200 }}
                placeholder="选择课程"
                allowClear
                value={selectedCourse || undefined}
                onChange={handleCourseChange}
              >
                {progressData.courseProgress.map(course => (
                  <Option key={course.courseId} value={course.courseId}>
                    {course.courseName}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
          
          <Table
            columns={wrongExerciseColumns}
            dataSource={wrongExercises}
            rowKey={(record) => record.Exercise.id}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 道错题`
            }}
          />
        </div>
      )
    },
    {
      key: 'time-analysis',
      label: (
        <span>
          <ClockCircleOutlined />
          时间分析
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Text>时间范围:</Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
              />
              <Text>课程:</Text>
              <Select
                style={{ width: 200 }}
                placeholder="选择课程"
                allowClear
                value={selectedCourse || undefined}
                onChange={handleCourseChange}
              >
                {progressData.courseProgress.map(course => (
                  <Option key={course.courseId} value={course.courseId}>
                    {course.courseName}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>

          {timeAnalysis && (
            <Row gutter={[16, 16]}>
              {/* 每日学习统计 */}
              <Col span={24}>
                <Card title="每日学习统计">
                  <Table
                    dataSource={timeAnalysis.dailyStats}
                    rowKey="date"
                    pagination={false}
                    scroll={{ y: 300 }}
                    columns={[
                      {
                        title: '日期',
                        dataIndex: 'date',
                        key: 'date',
                        render: (date: string) => dayjs(date).format('YYYY-MM-DD')
                      },
                      {
                        title: '答题数量',
                        dataIndex: 'answerCount',
                        key: 'answerCount'
                      },
                      {
                        title: '正确率',
                        key: 'accuracy',
                        render: (_, record: any) => 
                          `${Math.round((record.correctCount / record.answerCount) * 100)}%`
                      },
                      {
                        title: '学习时间',
                        key: 'totalTime',
                        render: (_, record: any) => 
                          formatTime(record.totalStudyTime + record.totalResponseTime)
                      }
                    ]}
                  />
                </Card>
              </Col>

              {/* 时段分布 */}
              <Col span={12}>
                <Card title="学习时段分布">
                  <Table
                    dataSource={timeAnalysis.hourlyStats.filter(stat => stat.count > 0)}
                    rowKey="hour"
                    pagination={false}
                    scroll={{ y: 300 }}
                    columns={[
                      {
                        title: '时段',
                        dataIndex: 'hour',
                        key: 'hour',
                        render: (hour: number) => `${hour}:00-${hour + 1}:00`
                      },
                      {
                        title: '答题次数',
                        dataIndex: 'count',
                        key: 'count'
                      },
                      {
                        title: '平均时间',
                        dataIndex: 'averageTime',
                        key: 'averageTime',
                        render: (time: number) => formatTime(Math.round(time))
                      }
                    ]}
                  />
                </Card>
              </Col>

              {/* 星期分布 */}
              <Col span={12}>
                <Card title="星期学习分布">
                  <Table
                    dataSource={timeAnalysis.weeklyStats.filter(stat => stat.count > 0)}
                    rowKey="weekday"
                    pagination={false}
                    columns={[
                      {
                        title: '星期',
                        dataIndex: 'weekdayName',
                        key: 'weekdayName'
                      },
                      {
                        title: '答题次数',
                        dataIndex: 'count',
                        key: 'count'
                      },
                      {
                        title: '平均时间',
                        dataIndex: 'averageTime',
                        key: 'averageTime',
                        render: (time: number) => formatTime(Math.round(time))
                      }
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/students')}
          style={{ marginRight: 16 }}
        >
          返回学生列表
        </Button>
        <Title level={2} style={{ display: 'inline-block', margin: 0 }}>
          {progressData.student.name} - 学习进度
        </Title>
        <Text type="secondary" style={{ marginLeft: 16 }}>
          {progressData.student.email}
        </Text>
      </div>

      <Tabs items={tabItems} />
    </div>
  );
};

export default StudentProgress; 