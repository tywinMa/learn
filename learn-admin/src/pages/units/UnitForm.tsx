import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Select, 
  InputNumber, 
  Switch,
  message,
  Spin,
  Divider,
  Row,
  Col,
  Tag
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { getUnitById, createUnit, updateUnit } from '../../services/unitService';
import type { CreateUnitParams, UpdateUnitParams } from '../../services/unitService';
import { getSubjects } from '../../services/subjectService';
import type { Subject } from '../../services/subjectService';
import { getGrades, getGradeSubjects, type Grade, type SubjectGrade } from '../../services/gradeService';
import { getCoursesBySubject } from '../../services/courseService';
import type { Course } from '../../services/courseService';

const { Option } = Select;
const { TextArea } = Input;

interface FormValues {
  id: string;
  subjectGradeId: number;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  color?: string;
  secondaryColor?: string;
  courseIds?: string[];
}

const UnitForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [form] = Form.useForm<FormValues>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [currentSubjectGrade, setCurrentSubjectGrade] = useState<SubjectGrade | null>(null);
  const [initialValues, setInitialValues] = useState<FormValues>({
    id: '',
    subjectGradeId: 0,
    title: '',
    description: '',
    order: 1,
    isPublished: true,
    color: '#1890ff',
    secondaryColor: '#f0f9ff',
    courseIds: []
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('=== UnitForm 数据加载开始 ===');
        
        // 获取学科列表
        const subjectsData = await getSubjects();
        console.log('获取到学科数据:', subjectsData);
        setSubjects(subjectsData);
        
        // 获取年级列表
        const gradesData = await getGrades();
        console.log('获取到年级数据:', gradesData);
        setGrades(gradesData);
        
        // 如果是编辑模式，获取单元信息
        if (isEditMode && id) {
          console.log('编辑模式，获取单元数据，ID:', id);
          const unitData = await getUnitById(id);
          console.log('获取到单元数据:', unitData);
          
                     if (unitData && unitData.subjectGrade) {
             const subjectGrade = unitData.subjectGrade;
             setSelectedSubject(subjectGrade.subjectCode);
             setSelectedGrade(subjectGrade.gradeId);
             setCurrentSubjectGrade(subjectGrade as SubjectGrade);
            
            console.log('设置选中学科年级:', subjectGrade);
            
            // 获取该学科的课程
            console.log('开始获取学科课程:', subjectGrade.subjectCode);
            const subjectCourses = await getCoursesBySubject(subjectGrade.subjectCode);
            console.log('获取到课程数据:', subjectCourses);
            setCourses(subjectCourses);
            
            // 确保courseIds是字符串数组
            let courseIds = unitData.courseIds || [];
            if (Array.isArray(courseIds)) {
              // 统一转换为字符串数组
              courseIds = courseIds.map(id => String(id));
            }
            console.log('处理后的courseIds:', courseIds);
            
            const formData: FormValues = {
              id: unitData.id,
              subjectGradeId: unitData.subjectGradeId,
              title: unitData.title,
              description: unitData.description || '',
              order: unitData.order,
              isPublished: unitData.isPublished,
              color: unitData.color,
              secondaryColor: unitData.secondaryColor,
              courseIds: courseIds
            };
            
            console.log('设置表单数据:', formData);
            setInitialValues(formData);
            form.setFieldsValue(formData);
            
            // 强制更新表单以触发重新渲染
            setTimeout(() => {
              form.setFieldsValue(formData);
              console.log('延迟设置表单数据完成');
            }, 100);
          } else {
            message.error('未找到单元信息或单元数据格式错误');
            navigate('/units');
          }
        } else {
          console.log('创建模式，设置默认值');
          if (subjectsData.length > 0) {
            setSelectedSubject(subjectsData[0].code);
          }
          if (gradesData.length > 0) {
            setSelectedGrade(gradesData[0].id);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
        console.log('=== UnitForm 数据加载完成 ===');
      }
    };
    
    fetchData();
  }, [id, isEditMode, form, navigate]);

  // 当学科和年级都选择后，查找对应的SubjectGrade关联
  useEffect(() => {
    if (selectedSubject && selectedGrade && !isEditMode) {
      findSubjectGrade();
    }
  }, [selectedSubject, selectedGrade, isEditMode]);

  const findSubjectGrade = async () => {
    if (!selectedSubject || !selectedGrade) {
      setCurrentSubjectGrade(null);
      setCourses([]);
      return;
    }

    try {
      // 获取指定年级的所有学科关联
      const gradeSubjects = await getGradeSubjects(selectedGrade);
      
      // 查找当前学科和年级的关联
      const subjectGrade = gradeSubjects.find(sg => sg.subjectCode === selectedSubject);
      
             if (subjectGrade) {
         setCurrentSubjectGrade(subjectGrade as SubjectGrade);
         // 获取课程列表
        const subjectCourses = await getCoursesBySubject(selectedSubject);
        setCourses(subjectCourses);
      } else {
        setCurrentSubjectGrade(null);
        setCourses([]);
        message.warning(`${getSubjectName(selectedSubject)}在${getGradeName(selectedGrade)}中不可用`);
      }
    } catch (error) {
      console.error('查找学科年级关联失败:', error);
      setCurrentSubjectGrade(null);
      setCourses([]);
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
  
  const handleSubjectChange = async (subjectCode: string) => {
    console.log('学科变更:', subjectCode);
    setSelectedSubject(subjectCode);
    form.setFieldsValue({ courseIds: [] });
  };

  const handleGradeChange = (gradeId: number) => {
    console.log('年级变更:', gradeId);
    setSelectedGrade(gradeId);
    form.setFieldsValue({ courseIds: [] });
  };
  
  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // 确保有选中的学科年级
      if (!currentSubjectGrade) {
        message.error('请先选择有效的学科和年级组合');
        return;
      }
      
      // 根据模式执行创建或更新操作
      if (isEditMode && id) {
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
        
        const result = await updateUnit(id, updateData);
        if (result) {
          message.success('大单元更新成功');
          navigate('/units');
        } else {
          message.error('更新大单元失败');
        }
      } else {
        // 创建单元 - 生成ID
        const generateId = () => {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          return `${selectedSubject}-grade${selectedGrade}-${timestamp}-${random}`;
        };
        
        const createData: CreateUnitParams = {
          id: values.id || generateId(),
          subjectGradeId: currentSubjectGrade.id,
          title: values.title,
          description: values.description,
          order: values.order,
          isPublished: values.isPublished,
          color: values.color,
          secondaryColor: values.secondaryColor,
          courseIds: values.courseIds
        };
        
        const result = await createUnit(createData);
        if (result) {
          message.success('大单元创建成功');
          navigate('/units');
        } else {
          message.error('创建大单元失败');
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/units');
  };

  const hasFormChanged = () => {
    const currentValues = form.getFieldsValue();
    return JSON.stringify(currentValues) !== JSON.stringify(initialValues) ||
      currentValues.courseIds !== initialValues.courseIds || 
      currentValues.subjectGradeId !== initialValues.subjectGradeId;
  };

  if (loading && isEditMode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card 
        title={isEditMode ? '编辑单元' : '创建单元'}
        extra={
          <Button onClick={handleCancel}>
            返回列表
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          {/* 学科年级选择 */}
          <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f8f9fa' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="年级"
                  required
                >
                  <Select
                    value={selectedGrade}
                    onChange={handleGradeChange}
                    placeholder="选择年级"
                    disabled={isEditMode}
                  >
                    {grades.map(grade => (
                      <Option key={grade.id} value={grade.id}>
                        {grade.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="学科"
                  required
                >
                  <Select
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    placeholder="选择学科"
                    disabled={isEditMode}
                  >
                    {subjects.map(subject => (
                      <Option key={subject.code} value={subject.code}>
                        {subject.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            {currentSubjectGrade ? (
              <Tag color="success" style={{ marginTop: 8 }}>
                {getCurrentDisplayName()} 可用
              </Tag>
            ) : selectedSubject && selectedGrade ? (
              <Tag color="error" style={{ marginTop: 8 }}>
                {getCurrentDisplayName()} 组合不可用
              </Tag>
            ) : null}
          </Card>

          {/* 单元基本信息 */}
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
                <Input 
                  type="color" 
                  style={{ width: '100%', height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="secondaryColor"
                label="次要颜色"
              >
                <Input 
                  type="color" 
                  style={{ width: '100%', height: 40 }}
                />
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

          <Divider />

          <Form.Item>
            <Row gutter={16}>
              <Col>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  disabled={!currentSubjectGrade}
                >
                  {isEditMode ? '更新单元' : '创建单元'}
                </Button>
              </Col>
              <Col>
                <Button onClick={handleCancel}>
                  取消
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UnitForm; 