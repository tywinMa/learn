import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Popconfirm, message, Modal, Form, Input, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { getSubjects } from '../../services/subjectService';
import { useSubjectStore } from '../../store/subjectStore';
import api from '../../services/api';
import type { Subject } from '../../services/subjectService';

// 颜色选择器
const ColorPicker: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value = '#1677ff', onChange }) => {
  const colors = [
    '#1677ff', // 蓝色
    '#52c41a', // 绿色
    '#722ed1', // 紫色
    '#eb2f96', // 粉色
    '#fa8c16', // 橙色
    '#13c2c2', // 青色
    '#faad14', // 黄色
    '#cf1322', // 红色
    '#2f54eb', // 靛蓝
    '#08979c', // 蓝绿色
  ];

  return (
    <div>
      <Input 
        type="color" 
        value={value} 
        onChange={e => onChange?.(e.target.value)} 
        style={{ width: 50, padding: 0, marginRight: 8 }}
      />
      <div style={{ display: 'flex', marginTop: 8, flexWrap: 'wrap' }}>
        {colors.map(color => (
          <div
            key={color}
            onClick={() => onChange?.(color)}
            style={{
              background: color,
              width: 20,
              height: 20,
              margin: 2,
              cursor: 'pointer',
              border: value === color ? '2px solid #000' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 扩展Subject接口添加description字段
interface ExtendedSubject extends Subject {
  description?: string;
}

const SubjectList: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ExtendedSubject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // 使用全局学科状态
  const { subjects, fetchSubjects, isLoading } = useSubjectStore();

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // 打开创建模态框
  const showCreateModal = () => {
    setEditingSubject(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const showEditModal = (subject: ExtendedSubject) => {
    setEditingSubject(subject);
    form.setFieldsValue({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      color: subject.color || '#1677ff'
    });
    setModalVisible(true);
  };

  // 保存学科
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingSubject) {
        // 更新学科
        await api({
          url: `/api/admin/subjects/${editingSubject.id}`,
          method: 'PUT',
          data: values
        });
        message.success('学科更新成功');
      } else {
        // 创建学科
        await api({
          url: '/api/admin/subjects',
          method: 'POST',
          data: values
        });
        message.success('学科创建成功');
      }

      setModalVisible(false);
      // 重新获取学科列表，使用强制刷新
      fetchSubjects(true);
    } catch (error) {
      console.error('保存学科失败:', error);
      message.error('操作失败，请检查表单或网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 删除学科
  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id);
      await api({
        url: `/api/admin/subjects/${id}`,
        method: 'DELETE'
      });
      message.success('学科删除成功');
      // 重新获取学科列表，使用强制刷新
      fetchSubjects(true);
    } catch (error) {
      console.error('删除学科失败:', error);
      message.error('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(null);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ExtendedSubject) => (
        <Tag color={record.color || '#1677ff'} style={{ fontSize: '14px', padding: '4px 8px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '颜色示例',
      key: 'color',
      render: (_: any, record: ExtendedSubject) => (
        <div style={{ 
          backgroundColor: record.color || '#1677ff', 
          width: 50, 
          height: 20, 
          borderRadius: 4 
        }} />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExtendedSubject) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此学科?"
            description="删除后将无法恢复，可能影响关联的课程和单元。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              type="text" 
              danger 
              loading={deleteLoading === record.id}
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="学科管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          新增学科
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={subjects as ExtendedSubject[]}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingSubject ? '编辑学科' : '新增学科'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="学科名称"
            rules={[{ required: true, message: '请输入学科名称' }]}
          >
            <Input placeholder="如：数学、语文、英语" />
          </Form.Item>
          
          <Form.Item
            name="code"
            label="学科代码"
            rules={[{ required: true, message: '请输入学科代码' }]}
            tooltip="英文代码，用于系统内部标识，如math、chinese、english"
          >
            <Input placeholder="请使用英文字母，如math" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="学科描述"
          >
            <Input.TextArea placeholder="学科的简要描述" rows={3} />
          </Form.Item>
          
          <Form.Item
            name="color"
            label="标签颜色"
            tooltip="选择学科标签颜色"
          >
            <ColorPicker />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SubjectList; 