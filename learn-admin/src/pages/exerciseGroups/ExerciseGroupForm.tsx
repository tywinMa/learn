import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Select, 
  message, 
  Transfer,
  Modal,
  List,
  Row,
  Col,
  Tag,
  Tooltip,
  Space,
  Descriptions,
  Typography
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  EditOutlined, 
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  createExerciseGroup, 
  updateExerciseGroup, 
  getExerciseGroupById 
} from '../../services/exerciseGroupService';
import { getSubjects } from '../../services/subjectService';
import { getExercisesBySubject, updateExercise, getExerciseById, type Exercise } from '../../services/exerciseService';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface TransferItem {
  key: string;
  title: string;
  description?: string;
}

const ExerciseGroupForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [transferData, setTransferData] = useState<TransferItem[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  
  // 弹窗相关状态
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  
  const isEditing = !!id;

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      const subjectList = await getSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error('获取学科列表失败:', error);
    }
  };

  // 根据学科获取习题列表
  const fetchExercisesBySubject = async (subjectCode: string) => {
    try {
      const exerciseList = await getExercisesBySubject(subjectCode);
      setExercises(exerciseList);
      
      // 转换为Transfer组件需要的格式
      const transferItems: TransferItem[] = exerciseList.map(exercise => ({
        key: exercise.id.toString(),
        title: `${exercise.id} - ${exercise.title || '无标题'}`,
        description: exercise.explanation || exercise.question || '无描述'
      }));
      
      setTransferData(transferItems);
      
      // 更新已选习题的详细信息
      updateSelectedExercises(exerciseList);
    } catch (error) {
      console.error('获取习题列表失败:', error);
      message.error('获取习题列表失败');
    }
  };

  // 更新已选习题的详细信息
  const updateSelectedExercises = (allExercises: Exercise[]) => {
    const selected = allExercises.filter(exercise => 
      targetKeys.includes(exercise.id.toString())
    );
    setSelectedExercises(selected);
  };

  // 学科变化时重新加载习题
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setTargetKeys([]); // 清空已选择的习题
    setSelectedExercises([]); // 清空已选习题详情
    if (value) {
      fetchExercisesBySubject(value);
    } else {
      setTransferData([]);
      setExercises([]);
    }
  };

  // Transfer组件变化处理
  const handleTransferChange = (newTargetKeys: React.Key[]) => {
    const keys = newTargetKeys.map(key => key.toString());
    setTargetKeys(keys);
    updateSelectedExercises(exercises);
  };

  // 查看习题详情
  const handleViewExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setViewModalVisible(true);
  };

  // 编辑习题
  const handleEditExercise = async (exercise: Exercise) => {
    try {
      // 获取最新的习题详情
      const exerciseDetail = await getExerciseById(exercise.id.toString());
      if (!exerciseDetail) {
        message.error('获取习题详情失败');
        return;
      }
      
      setCurrentExercise(exerciseDetail);
      
      // 设置编辑表单的值
      editForm.setFieldsValue({
        title: exerciseDetail.title,
        question: exerciseDetail.question,
        type: exerciseDetail.type,
        difficulty: exerciseDetail.difficulty,
        explanation: exerciseDetail.explanation,
        ...(exerciseDetail.type === 'choice' && {
          options: exerciseDetail.options || [],
          correctAnswer: exerciseDetail.correctAnswer
        }),
        ...(exerciseDetail.type === 'fill_blank' && {
          correctAnswer: Array.isArray(exerciseDetail.correctAnswer) 
            ? exerciseDetail.correctAnswer.join('\n') 
            : exerciseDetail.correctAnswer
        })
      });
      
      setEditModalVisible(true);
    } catch (error) {
      console.error('获取习题详情失败:', error);
      message.error('获取习题详情失败');
    }
  };

  // 保存编辑的习题
  const handleSaveExercise = async (values: any) => {
    if (!currentExercise) return;
    
    setEditLoading(true);
    try {
      let updateData = {
        ...values,
        subject: currentExercise.subject
      };

      // 处理不同类型题目的答案格式
      if (values.type === 'fill_blank' && typeof values.correctAnswer === 'string') {
        updateData.correctAnswer = values.correctAnswer.split('\n').filter((answer: string) => answer.trim());
      }

      const success = await updateExercise(currentExercise.id.toString(), updateData);
      
      if (success) {
        message.success('习题更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        
        // 刷新习题列表
        if (selectedSubject) {
          await fetchExercisesBySubject(selectedSubject);
        }
      }
    } catch (error) {
      console.error('更新习题失败:', error);
      message.error('更新习题失败');
    } finally {
      setEditLoading(false);
    }
  };

  // 加载习题组数据（编辑模式）
  const fetchExerciseGroupData = async () => {
    if (!isEditing || !id) return;
    
    setLoading(true);
    try {
      const exerciseGroup = await getExerciseGroupById(id);
      if (!exerciseGroup) {
        message.error('未找到习题组信息');
        return;
      }

      // 设置表单值
      form.setFieldsValue({
        name: exerciseGroup.name,
        description: exerciseGroup.description,
        subject: exerciseGroup.subject,
        isActive: exerciseGroup.isActive
      });

      // 设置学科并加载对应习题
      setSelectedSubject(exerciseGroup.subject);
      await fetchExercisesBySubject(exerciseGroup.subject);
      
      // 设置已选择的习题
      const exerciseIds = exerciseGroup.exerciseIds || [];
      setTargetKeys(exerciseIds.map(id => id.toString()));
      
      message.success('习题组数据加载成功');
    } catch (error) {
      console.error('加载习题组数据失败:', error);
      message.error('加载习题组数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchExerciseGroupData();
    }
  }, [isEditing, id]);

  useEffect(() => {
    updateSelectedExercises(exercises);
  }, [exercises, targetKeys]);

  // 表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        exerciseIds: targetKeys,
        // 如果是新建，生成ID
        ...(isEditing ? {} : { id: `group-${Date.now()}` })
      };

      let result;
      if (isEditing && id) {
        result = await updateExerciseGroup(id, formData);
      } else {
        result = await createExerciseGroup(formData);
      }

      if (result) {
        message.success(`习题组${isEditing ? '更新' : '创建'}成功`);
        navigate('/exercise-groups');
      } else {
        throw new Error('操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      message.error(`习题组${isEditing ? '更新' : '创建'}失败`);
    } finally {
      setLoading(false);
    }
  };

  // 获取学科名称
  const getSubjectName = (subjectCode: string) => {
    const subject = subjects.find(s => s.code === subjectCode);
    return subject?.name || subjectCode;
  };

  // 获取题型名称
  const getTypeName = (type: string) => {
    switch (type) {
      case 'choice': return '选择题';
      case 'fill_blank': return '填空题';
      case 'application': return '应用题';
      case 'matching': return '匹配题';
      default: return type;
    }
  };

  // 获取难度名称
  const getDifficultyName = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '简单';
      case 2: return '中等';
      case 3: return '困难';
      default: return `${difficulty}`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 页面头部 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/exercise-groups')}
              type="text"
              size="large"
              className="mr-4 hover:bg-gray-100"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 m-0">
                {isEditing ? '编辑习题组' : '创建习题组'}
              </h1>
              <p className="text-gray-500 mt-1 mb-0">
                {isEditing ? '修改习题组信息和关联习题' : '创建一个新的习题组'}
              </p>
            </div>
          </div>
          {isEditing && (
            <div className="text-right">
              <div className="text-sm text-gray-500">习题组ID</div>
              <div className="text-lg font-mono text-gray-700">{id}</div>
            </div>
          )}
        </div>
      </div>

      {/* 表单内容 */}
      <Card className="shadow-sm border border-gray-200">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="name"
                label="习题组名称"
                rules={[{ required: true, message: '请输入习题组名称' }]}
              >
                <Input placeholder="请输入习题组名称" size="large" />
              </Form.Item>
              
              <Form.Item
                name="subject"
                label="学科分类"
                rules={[{ required: true, message: '请选择学科分类' }]}
              >
                <Select 
                  placeholder="请选择学科分类" 
                  size="large"
                  onChange={handleSubjectChange}
                >
                  {subjects.map(subject => (
                    <Option key={subject.code} value={subject.code}>
                      {subject.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <Form.Item
              name="description"
              label="习题组描述"
              className="mb-0"
            >
              <TextArea 
                placeholder="请简要描述习题组的用途和特点" 
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </div>

          {/* 习题选择 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">选择习题</h3>
            {selectedSubject ? (
              <Transfer
                dataSource={transferData}
                titles={['可选习题', '已选习题']}
                targetKeys={targetKeys}
                onChange={handleTransferChange}
                render={item => {
                  // 检查是否是已选习题（右侧列表）
                  const isSelected = targetKeys.includes(item.key);
                  const exercise = exercises.find(ex => ex.id.toString() === item.key);
                  
                  if (isSelected && exercise) {
                    // 已选习题显示操作按钮
                    return (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1 pr-2">
                          <div className="text-sm font-medium">{exercise.title || '无标题'}</div>
                          <div className="text-xs text-gray-500 flex gap-1">
                            <Tag color="blue">{getTypeName(exercise.type)}</Tag>
                            <Tag color="orange">难度{getDifficultyName(exercise.difficulty)}</Tag>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Tooltip title="查看详情">
                            <Button 
                              type="text" 
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewExercise(exercise);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="编辑习题">
                            <Button 
                              type="text" 
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditExercise(exercise);
                              }}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    );
                  } else {
                    // 可选习题显示基本信息
                    return item.title;
                  }
                }}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
                }
                listStyle={{
                  width: 350,
                  height: 400,
                }}
                oneWay={false}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                请先选择学科分类
              </div>
            )}
          </div>

          {/* 状态设置 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">状态设置</h3>
            <Form.Item
              name="isActive"
              label="启用状态"
              initialValue={true}
            >
              <Select size="large">
                <Option value={true}>启用</Option>
                <Option value={false}>禁用</Option>
              </Select>
            </Form.Item>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button size="large" onClick={() => navigate('/exercise-groups')}>
              取消
            </Button>
            <Button 
              type="primary" 
              size="large" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
            >
              {isEditing ? '更新习题组' : '创建习题组'}
            </Button>
          </div>
        </Form>
      </Card>

      {/* 查看习题弹窗 */}
      <Modal
        title="查看习题详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentExercise && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="习题标题">
              {currentExercise.title || '无标题'}
            </Descriptions.Item>
            <Descriptions.Item label="学科">
              {getSubjectName(currentExercise.subject)}
            </Descriptions.Item>
            <Descriptions.Item label="题型">
              {getTypeName(currentExercise.type)}
            </Descriptions.Item>
            <Descriptions.Item label="难度">
              {getDifficultyName(currentExercise.difficulty)}
            </Descriptions.Item>
            <Descriptions.Item label="题目内容">
              <Paragraph>{currentExercise.question || '无题目内容'}</Paragraph>
            </Descriptions.Item>
            {currentExercise.type === 'choice' && currentExercise.options && (
              <Descriptions.Item label="选项">
                <div>
                  {currentExercise.options.map((option: string, index: number) => (
                    <div key={index} className="mb-1">
                      <Text strong={index === currentExercise.correctAnswer}>
                        {String.fromCharCode(65 + index)}. {option}
                        {index === currentExercise.correctAnswer && (
                          <Tag color="green" className="ml-2">正确答案</Tag>
                        )}
                      </Text>
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
            )}
            {currentExercise.type === 'fill_blank' && (
              <Descriptions.Item label="正确答案">
                <div>
                  {Array.isArray(currentExercise.correctAnswer) 
                    ? currentExercise.correctAnswer.map((answer: string, index: number) => (
                        <Tag key={index} color="green" className="mb-1">
                          {answer}
                        </Tag>
                      ))
                    : <Tag color="green">{currentExercise.correctAnswer}</Tag>
                  }
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="解析">
              <Paragraph>{currentExercise.explanation || '暂无解析'}</Paragraph>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 编辑习题弹窗 */}
      <Modal
        title="编辑习题"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSaveExercise}
        >
          <Form.Item
            name="title"
            label="习题标题"
            rules={[{ required: true, message: '请输入习题标题' }]}
          >
            <Input placeholder="请输入习题标题" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="题型"
                rules={[{ required: true, message: '请选择题型' }]}
              >
                <Select placeholder="请选择题型">
                  <Option value="choice">选择题</Option>
                  <Option value="fill_blank">填空题</Option>
                  <Option value="application">应用题</Option>
                  <Option value="matching">匹配题</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  <Option value={1}>简单</Option>
                  <Option value={2}>中等</Option>
                  <Option value={3}>困难</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="question"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea 
              placeholder="请输入题目内容" 
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item dependencies={['type']}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              
              if (type === 'choice') {
                return (
                  <>
                    <Form.List name="options">
                      {(fields, { add, remove }) => (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="font-medium">选项</label>
                            <Button 
                              type="dashed" 
                              onClick={() => add()} 
                              icon={<PlusOutlined />}
                            >
                              添加选项
                            </Button>
                          </div>
                          {fields.map((field, index) => (
                            <div key={field.key} className="flex items-center gap-2 mb-2">
                              <Text strong>{String.fromCharCode(65 + index)}.</Text>
                              <Form.Item 
                                {...field}
                                className="flex-1 mb-0"
                                rules={[{ required: true, message: '请输入选项内容' }]}
                              >
                                <Input placeholder="请输入选项内容" />
                              </Form.Item>
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Form.List>
                    
                    <Form.Item
                      name="correctAnswer"
                      label="正确答案"
                      rules={[{ required: true, message: '请选择正确答案' }]}
                    >
                      <Select placeholder="请选择正确答案">
                        {editForm.getFieldValue('options')?.map((_: any, index: number) => (
                          <Option key={index} value={index}>
                            选项 {String.fromCharCode(65 + index)}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                );
              } else if (type === 'fill_blank') {
                return (
                  <Form.Item
                    name="correctAnswer"
                    label="正确答案"
                    rules={[{ required: true, message: '请输入正确答案' }]}
                    extra="多个答案请换行输入"
                  >
                    <TextArea 
                      placeholder="请输入正确答案，多个答案请换行输入"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="explanation"
            label="解析"
          >
            <TextArea 
              placeholder="请输入解析内容（可选）" 
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-3">
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={editLoading}
                icon={<SaveOutlined />}
              >
                保存修改
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExerciseGroupForm; 