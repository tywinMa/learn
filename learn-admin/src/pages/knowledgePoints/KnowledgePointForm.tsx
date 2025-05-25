import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Radio,
  Space,
  message,
  Spin,
  Typography,
  Row,
  Col,
  Upload
} from 'antd';
import type { UploadProps } from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  getKnowledgePointById,
  createKnowledgePoint,
  updateKnowledgePoint,
  type CreateKnowledgePointData,
  type UpdateKnowledgePointData
} from '../../services/knowledgePointService';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

// 学科选项
const subjectOptions = [
  { value: 'math', label: '数学' },
  { value: 'chinese', label: '语文' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'politics', label: '政治' },
  { value: 'it', label: '信息技术' }
];

// 内容类型选项
const typeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' }
];

// 难度选项
const difficultyOptions = [
  { value: 1, label: '简单' },
  { value: 2, label: '较易' },
  { value: 3, label: '中等' },
  { value: 4, label: '较难' },
  { value: 5, label: '困难' }
];

interface FormValues {
  title: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  subject: string;
  difficulty: number;
}

// ReactQuill配置
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ]
};

const KnowledgePointForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<'text' | 'image' | 'video'>('text');

  // 初始化表单数据
  const initialValues: FormValues = {
    title: '',
    content: '',
    type: 'text',
    mediaUrl: '',
    subject: 'math',
    difficulty: 1
  };

  // 加载编辑数据
  useEffect(() => {
    if (isEditMode && id) {
      const fetchKnowledgePointData = async () => {
        setLoading(true);
        try {
          const knowledgePointData = await getKnowledgePointById(parseInt(id));
          if (knowledgePointData) {
            const formData = {
              title: knowledgePointData.title,
              content: knowledgePointData.content,
              type: knowledgePointData.type,
              mediaUrl: knowledgePointData.mediaUrl || '',
              subject: knowledgePointData.subject,
              difficulty: knowledgePointData.difficulty
            };
            form.setFieldsValue(formData);
            setSelectedType(knowledgePointData.type);
          }
        } catch (error) {
          console.error('获取知识点数据失败:', error);
          message.error('获取知识点数据失败');
          navigate('/knowledge-points');
        } finally {
          setLoading(false);
        }
      };
      fetchKnowledgePointData();
    } else {
      form.setFieldsValue(initialValues);
    }
  }, [id, isEditMode, form, navigate]);

  // 处理类型变更
  const handleTypeChange = (type: 'text' | 'image' | 'video') => {
    setSelectedType(type);
    if (type === 'text') {
      form.setFieldValue('mediaUrl', '');
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const submitData = {
        ...values,
        mediaUrl: selectedType === 'text' ? undefined : values.mediaUrl
      };

      if (isEditMode && id) {
        await updateKnowledgePoint(parseInt(id), submitData as UpdateKnowledgePointData);
        message.success('知识点更新成功');
      } else {
        await createKnowledgePoint(submitData as CreateKnowledgePointData);
        message.success('知识点创建成功');
      }
      
      navigate('/knowledge-points');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 文件上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/admin/upload/media',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        const mediaUrl = info.file.response?.data?.url;
        if (mediaUrl) {
          form.setFieldValue('mediaUrl', mediaUrl);
          message.success(`${info.file.name} 上传成功`);
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/knowledge-points')}
            >
              返回
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {isEditMode ? '编辑知识点' : '新建知识点'}
            </Title>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialValues}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="标题"
                name="title"
                rules={[
                  { required: true, message: '请输入知识点标题' },
                  { max: 100, message: '标题长度不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入知识点标题" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="学科"
                name="subject"
                rules={[{ required: true, message: '请选择学科' }]}
              >
                <Select placeholder="请选择学科">
                  {subjectOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="难度"
                name="difficulty"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  {difficultyOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="内容类型"
                name="type"
                rules={[{ required: true, message: '请选择内容类型' }]}
              >
                <Radio.Group 
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <Radio value="text">文本</Radio>
                  <Radio value="image">图片</Radio>
                  <Radio value="video">视频</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {selectedType !== 'text' && (
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label="媒体文件"
                  name="mediaUrl"
                  rules={[
                    { required: true, message: '请输入媒体文件URL或上传文件' },
                    { type: 'url', message: '请输入有效的URL地址' }
                  ]}
                >
                  <Input.Group compact>
                    <Input
                      style={{ width: 'calc(100% - 120px)' }}
                      placeholder="请输入媒体文件URL"
                      prefix={<LinkOutlined />}
                    />
                    <Upload {...uploadProps} showUploadList={false}>
                      <Button icon={<UploadOutlined />}>上传文件</Button>
                    </Upload>
                  </Input.Group>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="内容"
                name="content"
                rules={[
                  { required: true, message: '请输入知识点内容' },
                  { min: 10, message: '内容长度不能少于10个字符' }
                ]}
              >
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  style={{ height: '300px', marginBottom: '42px' }}
                  placeholder="请输入知识点的详细内容，支持富文本格式..."
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <Form.Item style={{ marginTop: '16px' }}>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={saving}
                    icon={<SaveOutlined />}
                  >
                    {saving ? '保存中...' : (isEditMode ? '更新' : '创建')}
                  </Button>
                  <Button onClick={() => navigate('/knowledge-points')}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default KnowledgePointForm; 