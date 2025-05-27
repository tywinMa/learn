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
  Divider
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { getUnitById, createUnit, updateUnit } from '../../services/unitService';
import type { CreateUnitParams, UpdateUnitParams } from '../../services/unitService';
import { getSubjects } from '../../services/subjectService';
import type { Subject } from '../../services/subjectService';
import { getCoursesBySubject } from '../../services/courseService';
import type { Course } from '../../services/courseService';

const { Option } = Select;
const { TextArea } = Input;

interface FormValues {
  id: string;
  subject: string;
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [initialValues, setInitialValues] = useState<FormValues>({
    id: '',
    subject: '',
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
        
        // 如果是编辑模式，获取单元信息
        if (isEditMode && id) {
          console.log('编辑模式，获取单元数据，ID:', id);
          const unitData = await getUnitById(id);
          console.log('获取到单元数据:', unitData);
          
          if (unitData) {
            setSelectedSubject(unitData.subject);
            console.log('设置选中学科:', unitData.subject);
            
            // 获取该学科的课程
            console.log('开始获取学科课程:', unitData.subject);
            const subjectCourses = await getCoursesBySubject(unitData.subject);
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
              subject: unitData.subject,
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
            message.error('未找到单元信息');
            navigate('/units');
          }
        } else {
          console.log('创建模式，无需加载单元数据');
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
  
  const handleSubjectChange = async (subjectCode: string) => {
    console.log('学科变更:', subjectCode);
    setSelectedSubject(subjectCode);
    form.setFieldsValue({ courseIds: [] });
    
    // 获取该学科的课程
    try {
      console.log('获取学科课程:', subjectCode);
      const subjectCourses = await getCoursesBySubject(subjectCode);
      console.log('获取到课程数据:', subjectCourses);
      setCourses(subjectCourses);
    } catch (error) {
      console.error('获取课程列表失败:', error);
      setCourses([]);
    }
  };
  
  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      // 根据模式执行创建或更新操作
      if (isEditMode && id) {
        // 更新单元
        const updateData: UpdateUnitParams = {
          subject: values.subject,
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
          return `${values.subject}-${timestamp}-${random}`;
        };
        
        const createData: CreateUnitParams = {
          id: values.id || generateId(),
          subject: values.subject,
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
      console.error('提交表单失败:', error);
      message.error('提交表单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? '编辑大单元' : '创建新大单元'}
        </h1>
      </div>
      
      <Card className="shadow-sm">
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={handleSubmit}
            requiredMark={false}
          >
            {!isEditMode && (
              <Form.Item
                name="id"
                label="大单元ID"
                tooltip="可以自定义ID，留空将自动生成"
              >
                <Input placeholder="如：math-1（可留空自动生成）" />
              </Form.Item>
            )}
            
            <Form.Item
              name="subject"
              label="所属学科"
              rules={[{ required: true, message: '请选择所属学科' }]}
            >
              <Select 
                placeholder="选择学科" 
                onChange={handleSubjectChange}
              >
                {subjects.map(subject => (
                  <Option key={subject.code} value={subject.code}>{subject.name} ({subject.code})</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Divider orientation="left">大单元信息</Divider>
            
            <Form.Item
              name="title"
              label="大单元标题"
              rules={[{ required: true, message: '请输入大单元标题' }]}
            >
              <Input placeholder="输入大单元标题" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="大单元描述"
            >
              <TextArea rows={3} placeholder="简要描述大单元内容和学习目标" />
            </Form.Item>
            
            <Form.Item
              name="order"
              label="显示顺序"
              tooltip="数字越小排序越靠前"
              rules={[{ required: true, message: '请输入显示顺序' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="输入显示顺序" />
            </Form.Item>
            
            <Form.Item shouldUpdate={(prevValues, currentValues) => 
              prevValues.courseIds !== currentValues.courseIds || prevValues.subject !== currentValues.subject
            }>
              {({ getFieldValue }) => {
                const selectedCourseIds = getFieldValue('courseIds') || [];
                const selectedCount = courses.filter(course => 
                  selectedCourseIds.includes(course.id)
                ).length;
                
                return (
                  <Form.Item
                    name="courseIds"
                    label="关联的课程"
                    tooltip="选择该大单元包含的课程"
                    extra={`当前已选择 ${selectedCount} 门课程（共 ${courses.length} 门可选）`}
                  >
                    <Select 
                      mode="multiple"
                      placeholder={courses.length > 0 ? "选择包含的课程" : "请先选择学科以加载课程"} 
                      allowClear
                      disabled={!selectedSubject || courses.length === 0}
                      showSearch
                      filterOption={(input, option) => {
                        if (option && option.children) {
                          return String(option.children).toLowerCase().includes(input.toLowerCase());
                        }
                        return false;
                      }}
                      optionLabelProp="label"
                      notFoundContent={courses.length === 0 ? "暂无课程数据" : "未找到匹配的课程"}
                    >
                      {courses.map(course => (
                        <Option 
                          key={course.id} 
                          value={course.id}
                          label={`${course.title || course.name} (${course.courseCode || course.course_code || course.id})`}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{course.title || course.name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              课程编号: {course.courseCode || course.course_code || course.id} | 
                              教师: {course.instructor || course.teacher?.name || '未分配'}
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }}
            </Form.Item>

            {/* 课程预览区域 */}
            <Form.Item shouldUpdate={(prevValues, currentValues) => {
              console.log('表单值更新检查:', {
                prev: prevValues.courseIds,
                current: currentValues.courseIds,
                courses: courses.length
              });
              return prevValues.courseIds !== currentValues.courseIds;
            }}>
              {({ getFieldValue }) => {
                const selectedCourseIds = getFieldValue('courseIds') || [];
                console.log('当前选中的课程IDs:', selectedCourseIds);
                console.log('可用课程列表:', courses.map(c => ({ id: c.id, title: c.title })));
                
                const selectedCourses = courses.filter(course => 
                  selectedCourseIds.includes(course.id)
                );
                console.log('匹配到的课程:', selectedCourses.map(c => ({ id: c.id, title: c.title })));
                
                if (!selectedCourseIds || selectedCourseIds.length === 0) {
                  return null;
                }
                
                return (
                  <Form.Item label="已选课程预览">
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '12px', 
                      borderRadius: '6px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {selectedCourses.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                          未找到匹配的课程数据
                          <div style={{ fontSize: '12px', marginTop: '8px' }}>
                            选中的ID: {selectedCourseIds.join(', ')}
                          </div>
                        </div>
                      ) : (
                        selectedCourses.map(course => (
                          <div key={course.id} style={{
                            background: 'white',
                            padding: '8px 12px',
                            marginBottom: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e8e8e8'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {course.title || course.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                              <span>编号: {course.courseCode || course.course_code || course.id}</span>
                              <span style={{ margin: '0 8px' }}>|</span>
                              <span>教师: {course.instructor || course.teacher?.name || '未分配'}</span>
                              <span style={{ margin: '0 8px' }}>|</span>
                              <span>学生: {course.students || 0}人</span>
                            </div>
                            {course.description && (
                              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                {course.description}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Form.Item>
                );
              }}
            </Form.Item>
            
            <Divider orientation="left">样式设置</Divider>
            
            <Form.Item
              name="color"
              label="主题颜色"
            >
              <Input type="color" style={{ width: 100 }} />
            </Form.Item>
            
            <Form.Item
              name="secondaryColor"
              label="次要颜色"
              tooltip="用于渐变效果"
            >
              <Input type="color" style={{ width: 100 }} />
            </Form.Item>
            
            <Form.Item
              name="isPublished"
              label="发布状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
            </Form.Item>
            
            <Form.Item>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => navigate('/units')}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEditMode ? '更新' : '创建'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default UnitForm; 