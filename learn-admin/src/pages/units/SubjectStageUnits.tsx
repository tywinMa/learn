import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Spin, 
  Empty, 
  Typography, 
  Tag, 
  Button, 
  message,
  Row,
  Col,
  Modal,
  Table,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  DragOutlined,
  SaveOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { getSubjects } from '../../services/subjectService';
import type { Subject } from '../../services/subjectService';
import { getCoursesBySubject, type Course } from '../../services/courseService';
import { createUnit, getAllUnits, getUnitsBySubject, updateUnit, deleteUnit, type CreateUnitParams, type UpdateUnitParams, type Unit } from '../../services/unitService';
import './SubjectStageUnits.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 颜色选择器组件
const ColorPicker: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value = '#1677ff', onChange }) => {
  const colors = [
    '#1677ff', '#52c41a', '#722ed1', '#eb2f96', '#fa8c16', '#13c2c2',
    '#faad14', '#cf1322', '#2f54eb', '#08979c', '#1890ff', '#f759ab'
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Input 
        type="color" 
        value={value} 
        onChange={e => onChange?.(e.target.value)} 
        style={{ width: 50, padding: 0 }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {colors.map(color => (
          <div
            key={color}
            onClick={() => onChange?.(color)}
            style={{
              background: color,
              width: 20,
              height: 20,
              cursor: 'pointer',
              border: value === color ? '2px solid #000' : '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 单元表单接口
interface UnitFormData {
  id?: string;
  subject: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  color?: string;
  secondaryColor?: string;
  courseIds?: string[];
}

const SubjectStageUnits: React.FC = () => {
  const [form] = Form.useForm();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);

  // 获取学科列表
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubject(data[0].code);
        }
      } catch (error) {
        console.error('获取学科列表失败:', error);
      }
    };
    fetchSubjects();
  }, []);

  // 获取选中学科的单元和课程
  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectData();
    }
  }, [selectedSubject]);

  const fetchSubjectData = async () => {
    if (!selectedSubject) return;
    
    setLoading(true);
    try {
      const [unitsData, coursesData] = await Promise.all([
        getUnitsBySubject(selectedSubject),
        getCoursesBySubject(selectedSubject)
      ]);
      setUnits(unitsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开创建模态框
  const showCreateModal = () => {
    if (!selectedSubject) {
      message.warning('请先选择学科');
      return;
    }
    
    setEditingUnit(null);
    form.resetFields();
    form.setFieldsValue({
      order: units.length + 1,
      isPublished: true,
      color: '#1677ff',
      secondaryColor: '#f0f9ff',
      courseIds: []
    });
    setModalVisible(true);
  };

  // 打开编辑模态框
  const showEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    form.setFieldsValue({
      subject: unit.subject,
      title: unit.title,
      description: unit.description || '',
      order: unit.order,
      isPublished: unit.isPublished,
      color: unit.color || '#1677ff',
      secondaryColor: unit.secondaryColor || '#f0f9ff',
      courseIds: unit.courseIds || []
    });
    setModalVisible(true);
  };

  // 保存单元
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 确保有选中的学科
      if (!selectedSubject) {
        message.error('请先选择学科');
        return;
      }

      if (editingUnit) {
        // 更新单元
        const updateData: UpdateUnitParams = {
          subject: selectedSubject,
          title: values.title,
          description: values.description,
          order: values.order,
          isPublished: values.isPublished,
          color: values.color,
          secondaryColor: values.secondaryColor,
          courseIds: values.courseIds
        };

        const result = await updateUnit(editingUnit.id, updateData);
        if (result) {
          message.success('单元更新成功');
          setModalVisible(false);
          fetchSubjectData();
        } else {
          message.error('更新单元失败');
        }
      } else {
        // 创建单元
        const generateId = () => {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          return `${selectedSubject}-${timestamp}-${random}`;
        };

        const createData: CreateUnitParams = {
          id: generateId(),
          subject: selectedSubject,
          title: values.title,
          description: values.description,
          order: values.order,
          isPublished: values.isPublished,
          color: values.color,
          secondaryColor: values.secondaryColor,
          courseIds: values.courseIds
        };

        console.log('创建单元数据:', createData);
        const result = await createUnit(createData);
        if (result) {
          message.success('单元创建成功');
          setModalVisible(false);
          fetchSubjectData();
        } else {
          message.error('创建单元失败');
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除单元
  const handleDelete = async (unitId: string) => {
    try {
      const success = await deleteUnit(unitId);
      if (success) {
        message.success('单元删除成功');
        fetchSubjectData();
      } else {
        message.error('删除单元失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 获取当前选中的学科
  const currentSubject = subjects.find(s => s.code === selectedSubject);

  // 表格列定义
  const columns = [
    {
      title: '顺序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      sorter: (a: Unit, b: Unit) => a.order - b.order,
      render: (order: number) => (
        <Tag color="blue">{order}</Tag>
      )
    },
    {
      title: '单元名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Unit) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              backgroundColor: record.color || '#1677ff' 
            }} 
          />
          <span style={{ fontWeight: 500 }}>{title}</span>
        </div>
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
      title: '关联课程',
      key: 'courses',
      render: (record: Unit) => {
        const unitCourses = courses.filter(course => 
          record.courseIds?.includes(course.id)
        );
        return (
          <div>
            <Text type="secondary">{unitCourses.length} 门课程</Text>
            {unitCourses.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {unitCourses.slice(0, 2).map(course => (
                  <Tag key={course.id} style={{ margin: '2px' }}>
                    {course.title}
                  </Tag>
                ))}
                {unitCourses.length > 2 && (
                  <Tag style={{ margin: '2px' }}>
                    +{unitCourses.length - 2}
                  </Tag>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '颜色主题',
      key: 'colors',
      width: 120,
      render: (record: Unit) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Tooltip title="主要颜色">
            <div 
              style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '4px', 
                backgroundColor: record.color || '#1677ff',
                border: '1px solid #ddd'
              }} 
            />
          </Tooltip>
          <Tooltip title="次要颜色">
            <div 
              style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '4px', 
                backgroundColor: record.secondaryColor || '#f0f9ff',
                border: '1px solid #ddd'
              }} 
            />
          </Tooltip>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 100,
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'orange'}>
          {isPublished ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (record: Unit) => (
        <Space size="small">
          <Tooltip title="编辑单元">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此单元吗？"
            description="删除后将无法恢复，关联的课程将被移除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除单元">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <AppstoreOutlined className="mr-2" />
          单元与课程管理
        </Title>
      </div>

      {/* 学科选择器 */}
      <Card className="mb-6">
        <div className="subject-selector">
          <Text strong style={{ marginRight: 16 }}>选择学科：</Text>
          {subjects.map(subject => (
            <Tag
              key={subject.code}
              className={`subject-tag ${selectedSubject === subject.code ? 'subject-tag-selected' : ''}`}
              style={{
                backgroundColor: selectedSubject === subject.code ? subject.color : 'transparent',
                borderColor: subject.color,
                color: selectedSubject === subject.code ? '#fff' : subject.color
              }}
              onClick={() => setSelectedSubject(subject.code)}
            >
              <div 
                className="subject-tag-dot" 
                style={{ backgroundColor: selectedSubject === subject.code ? '#fff' : subject.color }}
              />
              {subject.name}
            </Tag>
          ))}
        </div>
      </Card>

      {/* 单元列表 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingOutlined />
            <span>{currentSubject?.name || '未选择学科'} - 单元管理</span>
            <Tag color={currentSubject?.color}>
              {units.length} 个单元
            </Tag>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
            disabled={!selectedSubject}
          >
            新建单元
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={units}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个单元`
          }}
          locale={{
            emptyText: selectedSubject ? (
              <Empty 
                description={`${currentSubject?.name || '当前学科'}暂无单元`}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Empty 
                description="请先选择学科"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingUnit ? '编辑单元' : '新建单元'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
        width={800}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
        >
          {/* 显示当前学科 */}
          <Form.Item label="所属学科">
            <Input 
              value={`${currentSubject?.name || ''} (${selectedSubject})`}
              disabled
              style={{ 
                backgroundColor: '#f5f5f5',
                color: currentSubject?.color || '#1677ff',
                fontWeight: 500
              }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="单元名称"
                rules={[{ required: true, message: '请输入单元名称' }]}
              >
                <Input placeholder="输入单元名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order"
                label="显示顺序"
                rules={[{ required: true, message: '请输入显示顺序' }]}
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }} 
                  placeholder="数字越小排序越靠前"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="单元描述"
          >
            <TextArea 
              rows={3} 
              placeholder="简要描述单元内容和学习目标"
            />
          </Form.Item>

          <Form.Item
            name="courseIds"
            label="关联课程"
            tooltip="选择该单元包含的课程"
          >
            <Select
              mode="multiple"
              placeholder="选择包含的课程"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
              }
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="color"
                label="主要颜色"
              >
                <ColorPicker />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="secondaryColor"
                label="次要颜色"
              >
                <ColorPicker />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isPublished"
                label="发布状态"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="已发布" 
                  unCheckedChildren="草稿"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectStageUnits;