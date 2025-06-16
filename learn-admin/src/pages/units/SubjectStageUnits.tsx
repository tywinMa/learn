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
  Popconfirm,
  Divider
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
import { getGrades, getGradeSubjects, type Grade, type SubjectGrade } from '../../services/gradeService';
import { getCoursesBySubject, type Course } from '../../services/courseService';
import { createUnit, getAllUnits, getUnitsBySubjectGrade, updateUnit, deleteUnit, type CreateUnitParams, type UpdateUnitParams, type Unit } from '../../services/unitService';
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
  subjectGradeId: number;
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
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [currentSubjectGrade, setCurrentSubjectGrade] = useState<SubjectGrade | null>(null);
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

  // 获取年级列表
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await getGrades();
        setGrades(data);
        if (data.length > 0) {
          setSelectedGrade(data[0].id);
        }
      } catch (error) {
        console.error('获取年级列表失败:', error);
      }
    };
    fetchGrades();
  }, []);

  // 当学科和年级都选择后，查找对应的SubjectGrade关联
  useEffect(() => {
    if (selectedSubject && selectedGrade) {
      findSubjectGrade();
    }
  }, [selectedSubject, selectedGrade]);

  const findSubjectGrade = async () => {
    if (!selectedSubject || !selectedGrade) {
      setCurrentSubjectGrade(null);
      setUnits([]);
      setCourses([]);
      return;
    }

    try {
      // 获取指定年级的所有学科关联
      const gradeSubjects = await getGradeSubjects(selectedGrade);
      
      // 查找当前学科和年级的关联
      const subjectGrade = gradeSubjects.find(sg => sg.subjectCode === selectedSubject);
      
      if (subjectGrade) {
        setCurrentSubjectGrade(subjectGrade);
        await fetchSubjectGradeData(subjectGrade.id);
      } else {
        setCurrentSubjectGrade(null);
        setUnits([]);
        setCourses([]);
        message.warning(`${getSubjectName(selectedSubject)}在${getGradeName(selectedGrade)}中不可用`);
      }
    } catch (error) {
      console.error('查找学科年级关联失败:', error);
      setCurrentSubjectGrade(null);
      setUnits([]);
      setCourses([]);
    }
  };

  const fetchSubjectGradeData = async (subjectGradeId: number) => {
    setLoading(true);
    try {
      const [unitsData, coursesData] = await Promise.all([
        getUnitsBySubjectGrade(subjectGradeId),
        selectedSubject ? getCoursesBySubject(selectedSubject) : Promise.resolve([])
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

  // 获取学科名称
  const getSubjectName = (subjectCode: string) => {
    const subject = subjects.find(s => s.code === subjectCode);
    return subject ? subject.name : subjectCode;
  };

  // 获取年级名称
  const getGradeName = (gradeId: number) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : `年级${gradeId}`;
  };

  // 获取当前显示名称
  const getCurrentDisplayName = () => {
    if (!selectedSubject || !selectedGrade) {
      return '请选择学科和年级';
    }
    return `${getSubjectName(selectedSubject)} - ${getGradeName(selectedGrade)}`;
  };

  // 学科变更处理
  const handleSubjectChange = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
  };

  // 年级变更处理
  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId);
  };

  // 打开创建模态框
  const showCreateModal = () => {
    if (!currentSubjectGrade) {
      message.warning('请先选择有效的学科和年级组合');
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
      subjectGradeId: unit.subjectGradeId,
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

      // 确保有选中的学科年级
      if (!currentSubjectGrade) {
        message.error('请先选择有效的学科和年级组合');
        return;
      }

      if (editingUnit) {
        // 更新单元
        const updateData: UpdateUnitParams = {
          subjectGradeId: currentSubjectGrade.id,
          title: values.title,
          description: values.description,
          order: values.order,
          isPublished: values.isPublished,
          color: values.color,
          secondaryColor: values.secondaryColor,
          courseIds: values.courseIds
        };
        
        await updateUnit(editingUnit.id, updateData);
        message.success('单元更新成功');
      } else {
        // 创建单元 - 生成ID
        const generateId = () => {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          return `${selectedSubject}-grade${selectedGrade}-${timestamp}-${random}`;
        };
        
        const createData: CreateUnitParams = {
          id: generateId(),
          subjectGradeId: currentSubjectGrade.id,
          title: values.title,
          description: values.description,
          order: values.order,
          isPublished: values.isPublished,
          color: values.color,
          secondaryColor: values.secondaryColor,
          courseIds: values.courseIds
        };
        
        await createUnit(createData);
        message.success('单元创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingUnit(null);
      if (currentSubjectGrade) {
        await fetchSubjectGradeData(currentSubjectGrade.id);
      }
    } catch (error) {
      console.error('保存单元失败:', error);
      message.error('保存单元失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除单元
  const handleDelete = async (unitId: string) => {
    try {
      await deleteUnit(unitId);
      message.success('单元删除成功');
      if (currentSubjectGrade) {
        await fetchSubjectGradeData(currentSubjectGrade.id);
      }
    } catch (error) {
      console.error('删除单元失败:', error);
      message.error('删除单元失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>单元管理</Title>
        <Text type="secondary">管理学科年级的单元内容</Text>
      </div>

      {/* 选择器区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <div>
            <Text strong>年级：</Text>
            <Select
              value={selectedGrade}
              onChange={handleGradeChange}
              style={{ width: 150, marginLeft: 8 }}
              placeholder="选择年级"
            >
              {grades.map(grade => (
                <Option key={grade.id} value={grade.id}>
                  {grade.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Text strong>学科：</Text>
            <Select
              value={selectedSubject}
              onChange={handleSubjectChange}
              style={{ width: 150, marginLeft: 8 }}
              placeholder="选择学科"
            >
              {subjects.map(subject => (
                <Option key={subject.code} value={subject.code}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </div>

          {currentSubjectGrade && (
            <div>
              <Tag color="success">
                {getCurrentDisplayName()} 可用
              </Tag>
            </div>
          )}
        </Space>
      </Card>

      {/* 单元列表 */}
      {currentSubjectGrade ? (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <AppstoreOutlined style={{ marginRight: 8 }} />
                {getCurrentDisplayName()} - 单元列表
              </span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showCreateModal}
              >
                创建单元
              </Button>
            </div>
          }
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : units.length === 0 ? (
            <Empty
              description="暂无单元数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {units.map((unit) => (
                <Col key={unit.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    style={{
                      background: `linear-gradient(135deg, ${unit.color || '#1677ff'} 0%, ${unit.secondaryColor || '#f0f9ff'} 100%)`,
                      color: '#fff',
                      border: 'none'
                    }}
                    bodyStyle={{ padding: '16px' }}
                    actions={[
                      <Tooltip title="编辑">
                        <EditOutlined onClick={() => showEditModal(unit)} />
                      </Tooltip>,
                      <Popconfirm
                        title="确定删除这个单元吗？"
                        onConfirm={() => handleDelete(unit.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Tooltip title="删除">
                          <DeleteOutlined />
                        </Tooltip>
                      </Popconfirm>
                    ]}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                        {unit.title}
                      </Text>
                    </div>
                    
                    {unit.description && (
                      <div style={{ marginBottom: 12 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                          {unit.description}
                        </Text>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={unit.isPublished ? 'success' : 'default'}>
                        {unit.isPublished ? '已发布' : '未发布'}
                      </Tag>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                        顺序: {unit.order}
                      </Text>
                    </div>
                    
                    {unit.courseIds && unit.courseIds.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                          包含 {unit.courseIds.length} 个课程
                        </Text>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      ) : (
        <Card>
          <Empty
            description={
              selectedSubject && selectedGrade 
                ? `${getCurrentDisplayName()}组合不可用`
                : "请选择学科和年级以查看单元"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingUnit ? '编辑单元' : '创建单元'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingUnit(null);
        }}
        onOk={handleSave}
        confirmLoading={saving}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            name="title"
            label="单元标题"
            rules={[{ required: true, message: '请输入单元标题' }]}
          >
            <Input placeholder="请输入单元标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="单元描述"
          >
            <TextArea
              placeholder="请输入单元描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order"
                label="显示顺序"
                rules={[{ required: true, message: '请输入显示顺序' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isPublished"
                label="是否发布"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="color"
                label="主题颜色"
              >
                <ColorPicker />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="secondaryColor"
                label="次要颜色"
              >
                <ColorPicker />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="courseIds"
            label="关联课程"
          >
            <Select
              mode="multiple"
              placeholder="选择关联的课程"
              allowClear
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectStageUnits;