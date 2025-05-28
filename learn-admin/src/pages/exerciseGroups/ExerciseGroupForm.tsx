import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, message, Transfer, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { ExerciseGroup } from '../../services/exerciseGroupService';
import { 
  getExerciseGroupById, 
  createExerciseGroup, 
  updateExerciseGroup 
} from '../../services/exerciseGroupService';
import { getExercisesBySubject } from '../../services/exerciseService';
import { getSubjects } from '../../services/subjectService';

const { TextArea } = Input;
const { Option } = Select;

interface TransferItem {
  key: string;
  title: string;
  description?: string;
}

const ExerciseGroupForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [transferData, setTransferData] = useState<TransferItem[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
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
        description: exercise.explanation || exercise.question || '无描述' // 使用explanation或question字段作为描述
      }));
      
      setTransferData(transferItems);
    } catch (error) {
      console.error('获取习题列表失败:', error);
      message.error('获取习题列表失败');
    }
  };

  // 学科变化时重新加载习题
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setTargetKeys([]); // 清空已选择的习题
    if (value) {
      fetchExercisesBySubject(value);
    } else {
      setTransferData([]);
    }
  };

  // Transfer组件变化处理
  const handleTransferChange = (newTargetKeys: React.Key[]) => {
    setTargetKeys(newTargetKeys.map(key => key.toString()));
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

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                render={item => item.title}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
                }
                listStyle={{
                  width: 300,
                  height: 400,
                }}
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
    </div>
  );
};

export default ExerciseGroupForm; 