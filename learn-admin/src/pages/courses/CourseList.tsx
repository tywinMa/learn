import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Tag, Popconfirm, Row, Col, Select, Empty, Pagination, Spin, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, UserOutlined, ClockCircleOutlined, FieldNumberOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getSubjectColor } from '../../services/subjectService';
import { getCourses, deleteCourse } from '../../services/courseService';
import type { Course } from '../../services/courseService';
import { useSubjectStore } from '../../store/subjectStore';

const { Option } = Select;

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'courseCode' | 'title' | 'instructor'>('title');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const pageSize = 8;
  
  // 使用学科全局状态
  const { 
    subjects, 
    isLoading: loadingSubjects, 
    fetchSubjects, 
    selectedSubject,
    setSelectedSubject 
  } = useSubjectStore();

  // 提取获取数据的逻辑为独立函数，方便重用
  const fetchData = useCallback(async () => {
    console.log('CourseList - fetchData 被调用');
    setLoading(true);
    try {
      // 获取课程数据
      console.log('CourseList - 开始加载课程数据');
      const coursesData = await getCourses();
      
      console.log('CourseList - 课程数据加载完成:', {
        courses: coursesData.length,
        sample: coursesData.length > 0 ? coursesData[0] : 'no courses'
      });
      
      // 如果无数据，直接设置空数组并返回
      if (!coursesData || !Array.isArray(coursesData) || coursesData.length === 0) {
        console.log('CourseList - 没有获取到课程数据');
        setCourses([]);
        setLoading(false);
        return;
      }
      
      // 调试接收到的课程数据结构
      if (coursesData.length > 0) {
        console.log('CourseList - 课程数据示例:', JSON.stringify(coursesData[0], null, 2));
      }
      
      // 处理课程数据，确保字段映射正确
      const processedCourses = coursesData.map(course => {
        // 如果已经有title字段，则不需要重新映射
        if (course.title && typeof course.title === 'string') {
          return course;
        }
        
        // 创建新的课程对象，确保所有字段正确映射
        const processedCourse: Course = {
          ...course,
          // 确保id字段存在且为字符串
          id: course.id?.toString() || `temp-${Math.random().toString(36).substring(2, 11)}`,
          // 使用name字段作为title (后端可能返回name而不是title)
          title: course.name || course.title || '',
          // 使用teacher.name作为instructor
          instructor: course.teacher?.name || course.instructor || '未分配教师',
          // 使用Subject.name作为subjectName
          subjectName: course.Subject?.name || course.subjectName || '未分类',
          // 保留其他字段
          students: course.students || 0,
          courseCode: course.courseCode || course.course_code || '',
          createdAt: course.createdAt || course.created_at || new Date().toISOString().split('T')[0]
        };
        
        return processedCourse;
      });
      
      console.log('CourseList - 处理后的课程数据:', {
        count: processedCourses.length,
        sample: processedCourses.length > 0 ? processedCourses[0] : 'no courses'
      });
      
      setCourses(processedCourses);
      message.success(`成功加载 ${processedCourses.length} 门课程`);
    } catch (error) {
      console.error('CourseList - 加载数据失败:', error);
      message.error('加载数据失败，请刷新页面重试');
      setCourses([]); // 确保在错误情况下设置空数组
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时执行获取数据
  useEffect(() => {
    console.log('CourseList - 组件挂载');
    // 获取学科数据
    fetchSubjects();
    
    // 获取课程数据
    fetchData();
    
    // 不再依赖courses.length，避免重复获取
  }, [fetchData, fetchSubjects]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const success = await deleteCourse(id);
      
      if (success) {
        message.success('课程删除成功');
        // 更新列表，移除已删除的课程
        setCourses(prev => prev.filter(course => course.id !== id));
      } else {
        message.error('删除课程失败');
      }
    } catch (error) {
      console.error('删除课程出错:', error);
      message.error('删除课程时发生错误');
    } finally {
      setDeleting(null);
    }
  };

  // 安全检查确保courses是数组，解决白屏问题
  const safeCoursesArray = Array.isArray(courses) ? courses : [];

  // 根据搜索和筛选条件过滤课程
  const filteredCourses = safeCoursesArray.filter((course) => {
    let matchSearch = true;
    
    if (searchText && course) { // 添加course存在性检查
      switch (searchType) {
        case 'courseCode':
          matchSearch = course.courseCode?.toLowerCase().includes(searchText.toLowerCase()) ?? false;
          break;
        case 'title':
          matchSearch = course.title?.toLowerCase().includes(searchText.toLowerCase()) ?? false;
          break;
        case 'instructor':
          matchSearch = course.instructor?.toLowerCase().includes(searchText.toLowerCase()) ?? false;
          break;
        default:
          matchSearch = 
            (course.title?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
            (course.instructor?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
            (course.description?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
            (course.courseCode?.toLowerCase().includes(searchText.toLowerCase()) ?? false);
      }
    }
    
    // 对学科进行模糊匹配，增强健壮性
    const matchSubject = !selectedSubject || 
      (course && 
        (
          course.subjectName === selectedSubject || 
          course.Subject?.name === selectedSubject ||
          (typeof course.subjectName === 'string' && 
           typeof selectedSubject === 'string' && 
           course.subjectName.toLowerCase() === selectedSubject.toLowerCase())
        )
      );
    
    return matchSearch && matchSubject;
  });

  // 记录筛选信息
  useEffect(() => {
    if (selectedSubject) {
      console.log(`CourseList - 按学科筛选: ${selectedSubject}, 筛选后课程数: ${filteredCourses.length}`);
    }
  }, [selectedSubject, filteredCourses.length]);

  // 分页处理
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // 格式化日期，只显示年月日
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // 尝试提取年月日部分，忽略时间
    const match = dateString.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : dateString.split('T')[0];
  };
  
  // 获取课程封面图片
  const getCourseImage = (course: Course) => {
    // 调试课程的媒体资源
    console.log(`CourseList - 课程[${course.id}]媒体资源:`, 
      course.sources ? JSON.stringify(course.sources) : '无sources'
    );

    if (course.sources && Array.isArray(course.sources) && course.sources.length > 0) {
      // 优先使用sources中的第一个图片
      const image = course.sources.find(s => s.type === 'image');
      if (image && image.url) {
        console.log(`CourseList - 使用sources中的图片: ${image.url}`);
        return image.url;
      }
    }
    
    // 如果有传统的coverImage字段也可以使用
    if (course.coverImage) {
      console.log(`CourseList - 使用coverImage: ${course.coverImage}`);
      return course.coverImage;
    }
    
    // 默认图片
    console.log(`CourseList - 使用默认图片`);
    return 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png';
  };

  // 获取搜索框占位符文本
  const getSearchPlaceholder = () => {
    switch (searchType) {
      case 'courseCode':
        return '请输入课程号';
      case 'title':
        return '请输入课程名称';
      case 'instructor':
        return '请输入讲师姓名';
      default:
        return '请输入搜索内容';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">课程管理</h1>
        <div className="space-x-2">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/courses/new')}
          >
            添加课程
          </Button>
        </div>
      </div>
      
      {/* 搜索和筛选区域 */}
      <Card className="mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <Input.Group compact>
              <Select 
                defaultValue="title" 
                value={searchType} 
                onChange={setSearchType}
                style={{ width: '30%' }}
              >
                <Option value="courseCode">课程号</Option>
                <Option value="title">课程名称</Option>
                <Option value="instructor">讲师</Option>
              </Select>
              <Input
                style={{ width: '70%' }}
                placeholder={getSearchPlaceholder()}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Input.Group>
          </div>
          
          <div className="min-w-[150px]">
            <Select
              placeholder="学科分类"
              style={{ width: '100%' }}
              allowClear
              value={selectedSubject}
              onChange={setSelectedSubject}
              loading={loadingSubjects}
            >
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.name}>
                  <div className="flex items-center">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2" 
                      style={{ background: subject.color || '#bfbfbf' }}
                    />
                    {subject.name}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>
      
      {/* 课程卡片列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" tip="加载课程数据中..." />
        </div>
      ) : paginatedCourses.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {paginatedCourses.map(course => {
              // 提取习题组信息（如果有）
              let exerciseGroupInfo = null;
              if (course.exerciseGroups && course.exerciseGroups.length > 0) {
                exerciseGroupInfo = {
                  count: course.exerciseGroups.length,
                  names: course.exerciseGroups.map(group => group.name).join(', ')
                };
              }
              
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                  <Card
                    hoverable
                    className="h-full flex flex-col course-card"
                    style={{ 
                      border: '1px solid #e8e8e8', 
                      borderTop: `3px solid ${getSubjectColor(course.Subject?.name || course.subjectName || '未分类')}`,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* 顶部图片区域 */}
                    <div 
                      className="h-40 bg-cover bg-center relative flex-shrink-0" 
                      style={{ 
                        backgroundImage: `url(${getCourseImage(course)})`,
                      }}
                    >
                      {/* 学科标签 - 左上角 */}
                      <Tag 
                        color={getSubjectColor(course.Subject?.name || course.subjectName || '未分类')} 
                        className="absolute top-2 left-2 z-10"
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          padding: '4px 8px',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          background: `${getSubjectColor(course.Subject?.name || course.subjectName || '未分类')}dd`
                        }}
                      >
                        {course.Subject?.name || course.subjectName || '未分类'}
                      </Tag>
                    </div>

                    {/* 中间课程内容区域 */}
                    <div className="flex-1 p-4">
                      <h3 className="text-lg font-medium mb-2 line-clamp-1" title={course.title}>
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2" title={course.description}>
                        {course.description || '暂无描述'}
                      </p>
                      <div className="flex flex-wrap text-sm text-gray-500 gap-y-1">
                        {/* 课程编号 */}
                        <div className="w-full flex items-center">
                          <FieldNumberOutlined className="mr-1" />{course.courseCode || '无课程号'}
                        </div>
                        
                        {/* 教师信息 */}
                        <div className="w-full flex items-center">
                          <UserOutlined className="mr-1" />{course.teacher?.name || course.instructor || '未分配教师'}
                        </div>
                        
                        {/* 学生数量 */}
                        <div className="w-full flex items-center">
                          <BookOutlined className="mr-1" />{course.students || 0} 名学生
                        </div>
                        
                        {/* 创建日期 */}
                        <div className="w-full flex items-center">
                          <ClockCircleOutlined className="mr-1" />创建于 {formatDate(course.createdAt)}
                        </div>
                        
                        {/* 关联习题组信息 */}
                        {exerciseGroupInfo && (
                          <div className="w-full flex items-center">
                            <QuestionCircleOutlined className="mr-1" />
                            <span className="text-gray-600 truncate">
                              {exerciseGroupInfo.count}个习题组: {exerciseGroupInfo.names}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 底部编辑模块 */}
                    <div className="border-t border-gray-100 p-3 flex-shrink-0">
                      <div className="flex justify-center gap-4">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => navigate(`/courses/${course.id}/edit`)}
                          className="flex-1"
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="确定要删除这个课程吗?"
                          onConfirm={() => handleDelete(course.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            loading={deleting === course.id}
                            className="flex-1"
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
          
          {/* 分页 */}
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredCourses.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total) => `共 ${total} 门课程`}
            />
          </div>
        </>
      ) : (
        <Empty description="没有找到符合条件的课程" />
      )}
    </div>
  );
};

export default CourseList; 