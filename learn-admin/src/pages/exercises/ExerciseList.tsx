import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Popconfirm, 
  message, 
  Select,
  Tooltip,
  Result,
  Row,
  Col,
  Typography,
  Empty,
  Pagination,
  Modal,
  Form,
  Space,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SearchOutlined,
  BookOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAllExercises, deleteExercise } from '../../services/exerciseService';
import { getChoiceExerciseOne } from '../../services/aiService';
import { getCourses } from '../../services/courseService';
import { getSubjects } from '../../services/subjectService';
import type { Exercise } from '../../services/exerciseService';

const { Option } = Select;
const { Text, Paragraph, Title } = Typography;

const ExerciseList: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // AI生成相关状态
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState<'select' | 'form'>('select');
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [aiForm] = Form.useForm();
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const exercisesData = await getAllExercises();
      if (Array.isArray(exercisesData)) {
        setExercises(exercisesData);
        console.log('习题数据加载成功，数量:', exercisesData.length);
      } else {
        console.error('习题数据格式错误:', exercisesData);
        setError('习题数据格式错误');
        setExercises([]);
      }
    } catch (error) {
      console.error('加载习题数据失败:', error);
      message.error('加载习题数据失败');
      setError('加载习题数据失败，请刷新页面重试');
      setExercises([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载课程和学科数据
  const fetchBasicData = useCallback(async () => {
    try {
      const [coursesData, subjectsData] = await Promise.all([
        getCourses(),
        getSubjects()
      ]);
      setCourses(coursesData || []);
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('加载基础数据失败:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchExercises();
    fetchBasicData();
  }, [fetchExercises, fetchBasicData]);
  
  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const success = await deleteExercise(id);
      
      if (success) {
        message.success('习题删除成功');
        setExercises(prev => prev.filter(exercise => exercise.id !== id));
      } else {
        message.error('删除习题失败');
      }
    } catch (error) {
      console.error('删除习题出错:', error);
      message.error('删除习题时发生错误');
    } finally {
      setDeleting(null);
    }
  };
  
  // AI生成习题相关函数
  const handleAiModalOpen = () => {
    setAiModalVisible(true);
    setAiStep('select');
    aiForm.resetFields();
  };

  const handleAiModalClose = () => {
    setAiModalVisible(false);
    setAiStep('select');
    aiForm.resetFields();
    setAiGenerating(false);
  };

  const handleSelectGenerationType = (type: string) => {
    if (type === 'info') {
      setAiStep('form');
    } else {
      message.info('上传图片生成功能暂未开放');
    }
  };

  const handleAiGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      const { subject, type, courseId, relevance, difficulty } = values;

      if (type !== 'choice') {
        message.warning('目前只支持生成选择题');
        return;
      }

      setAiGenerating(true);

      // 找到选中的课程信息
      const selectedCourse = courses.find(course => course.id === courseId);
      const courseName = selectedCourse?.title || '通用课程';

      // 找到选中的学科信息
      const selectedSubject = subjects.find(subj => subj.code === subject);
      const subjectName = selectedSubject?.name || subject;

      // 调用AI生成接口
      const aiResult = await getChoiceExerciseOne(
        subjectName,
        courseName,
        relevance,
        difficulty
      );

      if (aiResult) {
        // 将AI生成的数据存储到sessionStorage，以便在新页面中使用
        const exerciseData = {
          subject: subject,
          title: aiResult.title || '',
          question: aiResult.question || '',
          type: aiResult.type || 'choice',
          difficulty: aiResult.difficulty || 2,
          options: aiResult.options || [],
          correctAnswer: aiResult.correctAnswer || 0,
          explanation: aiResult.explanation || '',
          isAI: true
        };

        sessionStorage.setItem('aiGeneratedExercise', JSON.stringify(exerciseData));
        
        message.success('AI生成习题成功，正在跳转到编辑页面...');
        
        // 延迟一下再跳转，让用户看到成功消息
        setTimeout(() => {
          navigate('/exercises/new');
        }, 1000);
      }
    } catch (error) {
      console.error('AI生成习题失败:', error);
      message.error('AI生成习题失败，请重试');
    } finally {
      setAiGenerating(false);
    }
  };
  
  // 确保exercises是数组后再筛选
  const filteredExercises = Array.isArray(exercises) ? exercises.filter(exercise => {
    if (!exercise) return false;
    
    // 搜索标题内容
    const searchContent = exercise.title || '';
    const matchSearch = searchText ? 
      searchContent.toLowerCase().includes(searchText.toLowerCase()) : 
      true;
    
    const matchSubject = subjectFilter ? 
      exercise.subject === subjectFilter : 
      true;
    
    // 检查题型
    const matchType = typeFilter ? 
      exercise.type === typeFilter : 
      true;
    
    // 检查难度
    const matchDifficulty = difficultyFilter ? 
      exercise.difficulty === parseInt(difficultyFilter) : 
      true;
    
    return matchSearch && matchSubject && matchType && matchDifficulty;
  }) : [];
  
  // 获取学科名称
  const getSubjectName = (subject: string) => {
    switch (subject) {
      case 'math': return '数学';
      case 'chinese': return '语文';
      case 'english': return '英语';
      case 'physics': return '物理';
      case 'chemistry': return '化学';
      case 'biology': return '生物';
      case 'history': return '历史';
      case 'geography': return '地理';
      case 'politics': return '政治';
      case 'it': return '信息技术';
      default: return subject;
    }
  };

  // 获取学科渐变色
  const getSubjectGradient = (subject: string) => {
    switch (subject) {
      case 'math': return 'from-blue-400 to-blue-600';
      case 'chinese': return 'from-red-400 to-red-600';
      case 'english': return 'from-green-400 to-green-600';
      case 'physics': return 'from-purple-400 to-purple-600';
      case 'chemistry': return 'from-orange-400 to-orange-600';
      case 'biology': return 'from-cyan-400 to-cyan-600';
      case 'history': return 'from-yellow-400 to-yellow-600';
      case 'geography': return 'from-emerald-400 to-emerald-600';
      case 'politics': return 'from-pink-400 to-pink-600';
      case 'it': return 'from-indigo-400 to-indigo-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  // 出现错误时的渲染
  if (error) {
    return (
      <Result
        status="warning"
        title="加载习题数据失败"
        subTitle={error}
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            loading={loading}
            onClick={fetchExercises}
          >
            重新加载
          </Button>
        }
      />
    );
  }

  // 当前页的习题数据
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      {/* 标题栏区域 - 增加下边框、调整布局 */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center">
          <BookOutlined className="mr-2 text-2xl text-blue-500" />
          <Title level={2} style={{ margin: 0 }}>习题管理</Title>
        </div>
        <div className="flex items-center">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/exercises/new')}
            size="large"
          >
            添加习题
          </Button>
          <Button 
            type="primary" 
            icon={<RobotOutlined />}
            onClick={handleAiModalOpen}
            size="large"
            className="ml-2"
          >
            AI生成
          </Button>
        </div>
      </div>
      
      {/* 搜索和筛选区域 - 恢复原始样式 */}
      <Card className="mb-6 shadow-sm rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-600 mb-1">习题标题</div>
            <Input
              placeholder="输入习题标题关键词"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              className="w-full"
            />
          </div>
          
          <div>
            <div className="text-gray-600 mb-1">学科筛选</div>
            <Select
              placeholder="选择学科"
              style={{ width: '100%' }}
              value={subjectFilter}
              onChange={setSubjectFilter}
              allowClear
              size="large"
            >
              <Option value="math">数学</Option>
              <Option value="chinese">语文</Option>
              <Option value="english">英语</Option>
              <Option value="physics">物理</Option>
              <Option value="chemistry">化学</Option>
              <Option value="biology">生物</Option>
              <Option value="history">历史</Option>
              <Option value="geography">地理</Option>
              <Option value="politics">政治</Option>
              <Option value="it">信息技术</Option>
            </Select>
          </div>
          
          <div>
            <div className="text-gray-600 mb-1">题型筛选</div>
            <Select
              placeholder="选择题型"
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              size="large"
            >
              <Option value="choice">选择题</Option>
              <Option value="fill_blank">填空题</Option>
              <Option value="application">应用题</Option>
              <Option value="matching">匹配题</Option>
            </Select>
          </div>
          
          <div>
            <div className="text-gray-600 mb-1">难度筛选</div>
            <Select
              placeholder="选择难度"
              style={{ width: '100%' }}
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              allowClear
              size="large"
            >
              <Option value="1">简单</Option>
              <Option value="2">中等</Option>
              <Option value="3">困难</Option>
            </Select>
          </div>
        </div>
      </Card>
      
      {/* 习题卡片列表 */}
      {loading ? (
        <div className="flex justify-center items-center p-10">
          <div className="text-center">
            <div className="mb-4">
              <img src="/loading-spin.svg" alt="加载中" className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-500">正在加载习题数据...</p>
          </div>
        </div>
      ) : filteredExercises.length > 0 ? (
        <>
          <Row gutter={[16, 16]} className="mb-6">
            {paginatedExercises.map((exercise) => (
              <Col key={exercise.id} xs={24} sm={12} md={8} lg={6}>
                <Card 
                  className="h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 border-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
                  hoverable
                  bodyStyle={{ 
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  actions={[
                    <Tooltip title="编辑习题" key="edit">
                      <Button 
                        type="primary" 
                        ghost
                        icon={<EditOutlined />} 
                        onClick={() => navigate(`/exercises/${exercise.id}/edit`)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300"
                      >
                        编辑
                      </Button>
                    </Tooltip>,
                    <Tooltip title="删除习题" key="delete">
                      <Popconfirm
                        title="确定删除这个习题吗？"
                        description="此操作不可恢复，请谨慎操作！"
                        onConfirm={() => handleDelete(String(exercise.id))}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button 
                          danger
                          ghost
                          icon={<DeleteOutlined />} 
                          loading={deleting === String(exercise.id)}
                          className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-300"
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Tooltip>
                  ]}
                >
                  {/* 顶部装饰条 */}
                  <div className={`h-3 bg-gradient-to-r ${getSubjectGradient(exercise.subject)} shadow-sm`}></div>
                  
                  <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-transparent to-slate-50">
                    {/* 标题和学科标签区域 */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Text strong className="text-lg text-slate-800 leading-tight font-bold flex-1 pr-3">
                          {exercise.title}
                        </Text>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getSubjectGradient(exercise.subject)} shadow-sm flex-shrink-0`}>
                          {getSubjectName(exercise.subject)}
                        </div>
                      </div>
                      
                      {/* 元信息 */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center text-slate-600 bg-green-100 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          <span className="font-medium">系统</span>
                        </div>
                        <div className="flex items-center text-slate-600 bg-indigo-100 px-2 py-1 rounded-full">
                          <BookOutlined className="mr-1 text-indigo-600 text-xs" />
                          <span className="font-medium">{exercise.type}</span>
                        </div>
                        <div className="flex items-center text-slate-600 bg-yellow-100 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></div>
                          <span className="font-medium">难度 {exercise.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 描述区域 */}
                    <div className="flex-1">
                      {exercise.question ? (
                        <div className="bg-white p-3 rounded-lg border-l-3 border-blue-400 shadow-sm">
                          <Paragraph 
                            ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} 
                            className="mb-0 text-slate-700 leading-relaxed text-sm"
                            title={exercise.question}
                          >
                            {exercise.question}
                          </Paragraph>
                        </div>
                      ) : (
                        <div className="bg-slate-100 p-3 rounded-lg text-center border border-slate-200">
                          <Text type="secondary" className="text-xs">
                            暂无题目内容
                          </Text>
                        </div>
                      )}
                    </div>
                    
                    {/* 底部时间信息 */}
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="text-xs text-slate-500 text-center">
                        {new Date(exercise.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* 分页 */}
          <div className="flex justify-center mt-6 mb-8">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredExercises.length}
              onChange={(page) => setCurrentPage(page)}
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 个习题`}
            />
          </div>
        </>
      ) : (
        <Empty 
          description={
            <span>
              {searchText || subjectFilter || typeFilter || difficultyFilter ? 
                '没有找到符合筛选条件的习题' : 
                '暂无习题数据，请点击添加按钮创建新习题'}
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* AI生成弹窗 */}
      <Modal
        title="AI一键生成习题"
        open={aiModalVisible}
        onCancel={handleAiModalClose}
        footer={null}
        width={600}
        destroyOnClose
      >
        {aiStep === 'select' ? (
          <div className="py-8">
            <div className="text-center mb-6">
              <RobotOutlined className="text-4xl text-blue-500 mb-4" />
              <Title level={3}>选择生成方式</Title>
              <Text type="secondary">请选择适合您的习题生成方式</Text>
            </div>
            
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card
                  hoverable
                  className="text-center h-full border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300"
                  onClick={() => handleSelectGenerationType('upload')}
                  bodyStyle={{ padding: '32px 16px' }}
                >
                  <div className="text-5xl mb-4">📷</div>
                  <Title level={4} className="mb-2">上传图片生成</Title>
                  <Text type="secondary" className="text-sm">
                    上传题目图片，AI智能识别并生成习题
                  </Text>
                  <div className="mt-4">
                    <Button size="small" disabled>暂未开放</Button>
                  </div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card
                  hoverable
                  className="text-center h-full border-2 border-solid border-blue-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                  onClick={() => handleSelectGenerationType('info')}
                  bodyStyle={{ padding: '32px 16px' }}
                >
                  <div className="text-5xl mb-4">📝</div>
                  <Title level={4} className="mb-2">信息生成</Title>
                  <Text type="secondary" className="text-sm">
                    根据学科、课程等信息智能生成习题
                  </Text>
                  <div className="mt-4">
                    <Button type="primary" size="small">立即体验</Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="py-4">
            <Form
              form={aiForm}
              layout="vertical"
              onFinish={handleAiGenerate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="选择学科"
                    name="subject"
                    rules={[{ required: true, message: '请选择学科' }]}
                  >
                    <Select placeholder="请选择学科" size="large">
                      {subjects.map(subject => (
                        <Option key={subject.code} value={subject.code}>
                          {subject.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    label="题目类型"
                    name="type"
                    rules={[{ required: true, message: '请选择题目类型' }]}
                  >
                    <Select placeholder="请选择题目类型" size="large">
                      <Option value="choice">选择题</Option>
                      <Option value="fill_blank" disabled>填空题（暂未支持）</Option>
                      <Option value="application" disabled>应用题（暂未支持）</Option>
                      <Option value="matching" disabled>匹配题（暂未支持）</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                label="相关课程"
                name="courseId"
                rules={[{ required: true, message: '请选择相关课程' }]}
              >
                <Select placeholder="请选择相关课程" size="large">
                  {courses.map(course => (
                    <Option key={course.id} value={course.id}>
                      {course.title} ({getSubjectName(course.subject)})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="题目相关性"
                    name="relevance"
                  >
                    <Input placeholder="例如：函数、方程等（可选）" size="large" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    label="题目难度"
                    name="difficulty"
                    initialValue={2}
                  >
                    <Select placeholder="请选择难度" size="large">
                      <Option value={1}>简单</Option>
                      <Option value={2}>中等</Option>
                      <Option value={3}>困难</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item className="mb-0 mt-6">
                <Space className="w-full justify-center">
                  <Button onClick={handleAiModalClose} size="large">
                    取消
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={aiGenerating}
                    size="large"
                    icon={<RobotOutlined />}
                  >
                    {aiGenerating ? '正在生成中...' : '开始生成'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExerciseList;