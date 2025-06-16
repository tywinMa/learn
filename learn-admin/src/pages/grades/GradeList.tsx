import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Popconfirm, 
  message, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  Tag,
  Tooltip,
  Switch,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useGradeStore } from '../../store/gradeStore';
import { useSubjectStore } from '../../store/subjectStore';
import { 
  createGrade, 
  updateGrade, 
  deleteGrade,
  addGradeSubject,
  removeGradeSubject
} from '../../services/gradeService';
import type { Grade, CreateGradeData, UpdateGradeData, SubjectGrade } from '../../services/gradeService';

const { Option } = Select;
const { TextArea } = Input;

// 学段映射
const LEVEL_MAP = {
  primary: '小学',
  middle: '初中',
  high: '高中'
} as const;

// 学段颜色映射
const LEVEL_COLORS = {
  primary: 'blue',
  middle: 'green', 
  high: 'orange'
} as const;

const GradeList: React.FC = () => {
  const [form] = Form.useForm();
  const [subjectForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // 使用全局状态
  const { 
    grades, 
    isLoading, 
    subjectGrades, 
    subjectGradeLoading,
    fetchGrades, 
    fetchGradeSubjects 
  } = useGradeStore();
  
  const { subjects, fetchSubjects } = useSubjectStore();

  useEffect(() => {
    fetchGrades();
    fetchSubjects();
  }, [fetchGrades, fetchSubjects]);

  // 打开创建模态框
  const showCreateModal = () => {
    setEditingGrade(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const showEditModal = (grade: Grade) => {
    setEditingGrade(grade);
    form.setFieldsValue({
      code: grade.code,
      name: grade.name,
      level: grade.level,
      levelNumber: grade.levelNumber,
      description: grade.description || '',
      order: grade.order,
      isActive: grade.isActive
    });
    setModalVisible(true);
  };

  // 打开学科关联模态框
  const showSubjectModal = (grade: Grade) => {
    setCurrentGrade(grade);
    subjectForm.resetFields();
    setSubjectModalVisible(true);
    fetchGradeSubjects(grade.id);
  };

  // 保存年级
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingGrade) {
        // 更新年级
        await updateGrade(editingGrade.id, values as UpdateGradeData);
        message.success('年级更新成功');
      } else {
        // 创建年级
        await createGrade(values as CreateGradeData);
        message.success('年级创建成功');
      }

      setModalVisible(false);
      fetchGrades(true);
    } catch (error) {
      console.error('保存年级失败:', error);
      message.error('操作失败，请检查表单或网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 删除年级
  const handleDelete = async (id: number) => {
    try {
      setDeleteLoading(id);
      await deleteGrade(id);
      message.success('年级删除成功');
      fetchGrades(true);
    } catch (error) {
      console.error('删除年级失败:', error);
      message.error('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(null);
    }
  };

  // 添加学科关联
  const handleAddSubject = async () => {
    if (!currentGrade) return;

    try {
      const values = await subjectForm.validateFields();
      await addGradeSubject({
        gradeId: currentGrade.id,
        subjectCode: values.subjectCode,
        order: values.order || 1
      });
      message.success('学科关联添加成功');
      subjectForm.resetFields();
      fetchGradeSubjects(currentGrade.id, true);
    } catch (error) {
      console.error('添加学科关联失败:', error);
      message.error('添加失败，请稍后重试');
    }
  };

  // 删除学科关联
  const handleRemoveSubject = async (subjectGradeId: number) => {
    if (!currentGrade) return;

    try {
      await removeGradeSubject(subjectGradeId);
      message.success('学科关联删除成功');
      fetchGradeSubjects(currentGrade.id, true);
    } catch (error) {
      console.error('删除学科关联失败:', error);
      message.error('删除失败，请稍后重试');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '年级名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Grade) => (
        <Tag color={LEVEL_COLORS[record.level]} style={{ fontSize: '14px', padding: '4px 8px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: '年级代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '学段',
      dataIndex: 'level',
      key: 'level',
      render: (level: keyof typeof LEVEL_MAP) => (
        <Tag color={LEVEL_COLORS[level]}>
          {LEVEL_MAP[level]}
        </Tag>
      )
    },
    {
      title: '年级序号',
      dataIndex: 'levelNumber',
      key: 'levelNumber',
      render: (levelNumber: number, record: Grade) => (
        `${LEVEL_MAP[record.level]}${levelNumber}年级`
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-'
    },
    {
      title: '显示顺序',
      dataIndex: 'order',
      key: 'order',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '激活' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Grade) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<LinkOutlined />} 
            onClick={() => showSubjectModal(record)}
          >
            学科关联
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此年级?"
            description="删除后将无法恢复，可能影响关联的课程。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoading === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 学科关联表格列定义
  const subjectColumns = [
    {
      title: '学科名称',
      key: 'subject',
      render: (_: any, record: SubjectGrade) => (
        <Tag color={record.subject?.color} style={{ fontSize: '14px', padding: '4px 8px' }}>
          {record.subject?.name}
        </Tag>
      )
    },
    {
      title: '学科代码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
    },
    {
      title: '显示顺序',
      dataIndex: 'order',
      key: 'order',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SubjectGrade) => (
        <Popconfirm
          title="确定删除此学科关联?"
          onConfirm={() => handleRemoveSubject(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" danger size="small">
            删除
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <Card
        title="年级管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            新增年级
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={grades}
          rowKey="id"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 年级编辑模态框 */}
      <Modal
        title={editingGrade ? '编辑年级' : '新增年级'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            level: 'primary',
            levelNumber: 1,
            order: 1,
            isActive: true
          }}
        >
          <Form.Item
            name="code"
            label="年级代码"
            rules={[
              { required: true, message: '请输入年级代码' },
              { pattern: /^[a-z0-9]+$/, message: '代码只能包含小写字母和数字' }
            ]}
          >
            <Input placeholder="如: grade1, grade7" />
          </Form.Item>

          <Form.Item
            name="name"
            label="年级名称"
            rules={[{ required: true, message: '请输入年级名称' }]}
          >
            <Input placeholder="如: 一年级, 初一, 高一" />
          </Form.Item>

          <Form.Item
            name="level"
            label="学段"
            rules={[{ required: true, message: '请选择学段' }]}
          >
            <Select placeholder="请选择学段">
              <Option value="primary">{LEVEL_MAP.primary}</Option>
              <Option value="middle">{LEVEL_MAP.middle}</Option>
              <Option value="high">{LEVEL_MAP.high}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="levelNumber"
            label="年级序号"
            rules={[{ required: true, message: '请输入年级序号' }]}
          >
            <InputNumber min={1} max={12} placeholder="在该学段中的年级序号" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="年级描述信息" />
          </Form.Item>

          <Form.Item
            name="order"
            label="显示顺序"
            rules={[{ required: true, message: '请输入显示顺序' }]}
          >
            <InputNumber min={1} placeholder="数字越小排序越靠前" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="激活" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 学科关联模态框 */}
      <Modal
        title={`${currentGrade?.name} - 学科关联管理`}
        open={subjectModalVisible}
        onCancel={() => setSubjectModalVisible(false)}
        footer={null}
        width={800}
      >
        <div>
          <Form
            form={subjectForm}
            layout="inline"
            onFinish={handleAddSubject}
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="subjectCode"
              rules={[{ required: true, message: '请选择学科' }]}
            >
              <Select placeholder="选择学科" style={{ width: 200 }}>
                {subjects
                  .filter(subject => 
                    !subjectGrades[currentGrade?.id || 0]?.some(sg => sg.subjectCode === subject.code)
                  )
                  .map(subject => (
                    <Option key={subject.code} value={subject.code}>
                      <Tag color={subject.color} style={{ marginRight: 8 }}>
                        {subject.name}
                      </Tag>
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item name="order">
              <InputNumber min={1} placeholder="显示顺序" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                添加关联
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <Table
            columns={subjectColumns}
            dataSource={subjectGrades[currentGrade?.id || 0] || []}
            rowKey="id"
            loading={subjectGradeLoading[currentGrade?.id || 0]}
            pagination={false}
            locale={{ emptyText: '暂无学科关联' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default GradeList; 