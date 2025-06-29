import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Switch,
  message,
  Spin,
  Card,
  Space,
  Divider,
  Table,
  Image,
  Modal,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  InboxOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  createCourse,
  updateCourse,
  getCourseById,
  type Course,
} from "../../services/courseService";
import { getSubjects, type Subject } from "../../services/subjectService";
import { courseMediaResourceService } from "../../services/mediaResourceService";

const { Option } = Select;
const { TextArea } = Input;

const CourseForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // 基础状态
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // 课程内容富文本编辑器
  const [content, setContent] = useState("");

  // 媒体资源管理状态
  const [courseMediaResources, setCourseMediaResources] = useState<any[]>([]);
  const [mediaResourcesLoading, setMediaResourcesLoading] = useState(false);
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // 获取学科数据
  const fetchSubjects = useCallback(async () => {
    try {
      console.log("CourseForm - 开始获取学科数据");
      const subjectsData = await getSubjects();
      console.log("CourseForm - 获取到学科数据:", subjectsData);

      if (Array.isArray(subjectsData) && subjectsData.length > 0) {
        setSubjects(subjectsData);
        console.log("CourseForm - 学科数据设置成功，数量:", subjectsData.length);
      } else {
        console.warn("CourseForm - 学科数据为空或格式不正确");
        message.warning("暂无可用学科数据");
      }
    } catch (error) {
      console.error("CourseForm - 获取学科数据失败:", error);
      message.error("获取学科数据失败，请重试");
    }
  }, []);

  // 获取课程关联的媒体资源
  const fetchCourseMediaResources = useCallback(async () => {
    if (!isEditing || !id) return;

    console.log("CourseForm - 开始获取课程媒体资源, courseId:", id);
    setMediaResourcesLoading(true);

    try {
      const response = await courseMediaResourceService.getCourseMediaResources(id);
      console.log("CourseForm - 获取到课程媒体资源:", response);

      if (Array.isArray(response)) {
        setCourseMediaResources(response);
        console.log(`CourseForm - 设置课程媒体资源成功，数量: ${response.length}`);
      } else {
        console.warn("CourseForm - 媒体资源数据格式不正确");
        setCourseMediaResources([]);
      }
    } catch (error) {
      console.error("CourseForm - 获取课程媒体资源失败:", error);
      setCourseMediaResources([]);
    } finally {
      setMediaResourcesLoading(false);
    }
  }, [isEditing, id]);

  // 加载课程数据（编辑模式）
  const fetchCourseData = useCallback(async () => {
    if (!isEditing || !id) return;

    console.log("CourseForm - 开始加载课程数据, id:", id);
    setLoading(true);

    try {
      const course = await getCourseById(id);
      console.log("CourseForm - 获取到课程数据:", course);

      if (!course) {
        message.error("课程不存在或已被删除");
        navigate("/courses");
        return;
      }

      // 设置表单数据
      const formData = {
        title: course.title,
        description: course.description,
        content: course.content,
        subject: course.subject,
        isPublished: course.isPublished !== false,
        unitType: course.unitType || "normal",
        position: course.position || "default",
        courseCode: course.courseCode || course.id,
        exerciseIds: course.exerciseIds || [],
        // 学科选择 - 优先使用subject字段（学科代码）
        subjectName: course.subject || course.Subject?.code || "",
      };
      
      console.log("CourseForm - 设置表单数据:", formData);
      form.setFieldsValue(formData);

      // 设置富文本编辑器内容
      if (course.content) {
        setContent(course.content);
      }

      message.success("课程数据加载成功");
    } catch (error) {
      console.error("加载课程数据失败:", error);
      message.error(
        "加载课程数据失败，请重试。错误详情: " +
          (error instanceof Error ? error.message : "未知错误")
      );
    } finally {
      setLoading(false);
    }
  }, [isEditing, id, form, navigate]);

  // 加载学科数据 - 使用单独的useEffect确保总是执行
  useEffect(() => {
    console.log("CourseForm - 组件挂载/刷新，加载学科数据");
    fetchSubjects();
  }, [fetchSubjects]);

  // 加载课程数据（如果是编辑模式）
  useEffect(() => {
    if (isEditing && id) {
      console.log("CourseForm - 编辑模式，加载课程数据");
      fetchCourseData();
      fetchCourseMediaResources();
    }
  }, [isEditing, id, fetchCourseData, fetchCourseMediaResources]);

  // 表单提交处理
  const handleSubmit = async (values: any) => {
    console.log("CourseForm - 开始提交表单:", values);
    console.log("CourseForm - 富文本内容:", content);

    // 验证必填字段
    if (!values.title?.trim()) {
      message.error("请输入课程标题");
      return;
    }
    if (!values.subjectName) {
      message.error("请选择学科分类");
      return;
    }

    setSubmitting(true);

    try {
      // 准备课程数据
      const courseData: Partial<Course> = {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        content: content || "", // 使用富文本编辑器的内容
        subject: values.subjectName, // 这里是学科代码
        isPublished: values.isPublished !== false,
        unitType: values.unitType || "normal",
        position: values.position || "default",
        courseCode: values.courseCode?.trim() || "",
        exerciseIds: values.exerciseIds || [],
        subjectName: values.subjectName, // 保持兼容性
      };

      console.log("CourseForm - 准备提交的课程数据:", {
        ...courseData,
        content: courseData.content ? `${courseData.content.substring(0, 100)}...` : "无内容",
      });

      let result: Course | null = null;

      if (isEditing && id) {
        console.log("CourseForm - 执行更新操作");
        result = await updateCourse(id, courseData);
      } else {
        console.log("CourseForm - 执行创建操作");
        result = await createCourse(courseData as Omit<Course, "id">);
      }

      if (result) {
        const action = isEditing ? "更新" : "创建";
        message.success(`课程${action}成功！`);
        console.log(`CourseForm - 课程${action}成功:`, result);
        navigate("/courses");
      } else {
        const action = isEditing ? "更新" : "创建";
        throw new Error(`课程${action}失败，服务器返回空结果`);
      }
    } catch (error) {
      console.error("CourseForm - 表单提交失败:", error);
      const action = isEditing ? "更新" : "创建";
      const errorMessage =
        error instanceof Error ? error.message : "未知错误";
      message.error(`课程${action}失败：${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 富文本编辑器工具栏配置
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "link",
    "image",
  ];

  // 删除媒体资源关联
  const handleDeleteMediaResource = async (relationId: number) => {
    try {
      await courseMediaResourceService.deleteCourseMediaResource(relationId);
      message.success('媒体资源关联删除成功');
      fetchCourseMediaResources(); // 重新获取数据
    } catch (error) {
      console.error('删除媒体资源关联失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 预览媒体资源
  const handlePreviewResource = (mediaResource: any) => {
    setPreviewResource(mediaResource);
    setPreviewVisible(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Spin size="large" tip="正在加载课程数据..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/courses")}
                type="text"
                className="flex items-center"
              >
                返回课程列表
              </Button>
              <Divider type="vertical" />
              <h1 className="text-2xl font-bold text-gray-900 m-0">
                {isEditing ? "编辑课程" : "创建新课程"}
              </h1>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          initialValues={{
            isPublished: true,
            unitType: "normal",
            position: "default",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 左侧列 */}
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  基本信息
                </h3>
                <Form.Item
                  name="title"
                  label="课程标题"
                  rules={[{ required: true, message: "请输入课程标题" }]}
                >
                  <Input placeholder="请输入课程标题" />
                </Form.Item>

                <Form.Item
                  name="courseCode"
                  label="课程编号"
                  extra="课程的唯一标识符，可留空自动生成"
                >
                  <Input placeholder="如：MATH001、PHYS101等" />
                </Form.Item>

                <Form.Item
                  name="subjectName"
                  label="学科分类"
                  rules={[{ required: true, message: "请选择学科分类" }]}
                >
                  <Select
                    placeholder="请选择学科"
                    showSearch
                    optionFilterProp="children"
                    loading={subjects.length === 0}
                  >
                    {subjects.map((subject) => (
                      <Option key={subject.code} value={subject.code}>
                        {subject.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="description" label="课程描述">
                  <TextArea
                    rows={4}
                    placeholder="请输入课程描述"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </div>

              {/* 发布设置 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  发布设置
                </h3>
                <div className="grid grid-cols-1 gap-4">
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

                  <Form.Item name="unitType" label="课程类型">
                    <Select placeholder="请选择课程类型">
                      <Option value="normal">普通学习课程</Option>
                      <Option value="exercise">练习课程</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="position" label="特殊位置">
                    <Select placeholder="请选择特殊位置">
                      <Option value="default">默认位置</Option>
                      <Option value="left">左侧</Option>
                      <Option value="right">右侧</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 右侧列 */}
            <div className="space-y-6">
              {/* 媒体资源管理区域 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <InboxOutlined className="mr-2 text-blue-500" />
                  关联的媒体资源
                  {isEditing && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({courseMediaResources.length} 个资源)
                    </span>
                  )}
                </h3>
                
                {!isEditing ? (
                  <div className="text-gray-600">
                    <p className="mb-2">📝 课程创建完成后，可在此处查看和管理关联的媒体资源。</p>
                    <p className="text-sm text-blue-600">
                      💡 在"媒体资源管理"页面创建媒体资源时，可以直接关联到课程。
                    </p>
                  </div>
                ) : (
                  <div>
                    {mediaResourcesLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <Spin size="small" />
                        <span className="ml-2 text-gray-500">加载中...</span>
                      </div>
                    ) : courseMediaResources.length > 0 ? (
                      <Table
                        dataSource={courseMediaResources}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: true }}
                        columns={[
                          {
                            title: '预览',
                            key: 'preview',
                            width: 80,
                            render: (_, record) => (
                              <div className="flex items-center space-x-2">
                                {record.mediaResource?.resourceType === 'image' ? (
                                  <Image
                                    src={record.mediaResource.resourceUrl}
                                    alt={record.mediaResource.title}
                                    width={40}
                                    height={40}
                                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                                    preview={{
                                      mask: <EyeOutlined />,
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                                    onClick={() => handlePreviewResource(record.mediaResource)}
                                  >
                                    <PlayCircleOutlined className="text-white text-lg" />
                                  </div>
                                )}
                              </div>
                            ),
                          },
                          {
                            title: '资源信息',
                            key: 'info',
                            render: (_, record) => (
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {record.mediaResource?.title}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Tag 
                                    color={record.mediaResource?.resourceType === 'video' ? 'blue' : 'green'}
                                  >
                                    {record.mediaResource?.resourceType === 'video' ? '视频' : '图片'}
                                  </Tag>
                                  <Tag 
                                    color={record.mediaResource?.status === 'published' ? 'green' : 'orange'}
                                  >
                                    {record.mediaResource?.status === 'published' ? '已发布' : '待发布'}
                                  </Tag>
                                </div>
                              </div>
                            ),
                          },
                          {
                            title: '操作',
                            key: 'actions',
                            width: 80,
                            render: (_, record) => (
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handlePreviewResource(record.mediaResource)}
                                  title="预览"
                                />
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => {
                                    Modal.confirm({
                                      title: '确认删除',
                                      content: '确定要取消此媒体资源与课程的关联吗？这不会删除媒体资源本身。',
                                      onOk: () => handleDeleteMediaResource(record.id),
                                    });
                                  }}
                                  title="取消关联"
                                />
                              </div>
                            ),
                          },
                        ]}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <InboxOutlined className="text-4xl text-gray-300 mb-2" />
                        <p>暂无关联的媒体资源</p>
                        <p className="text-sm">在"媒体资源管理"页面创建资源时可以关联到此课程</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 课程内容区域 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              课程内容
            </h3>
            <Form.Item
              name="content"
              label="学习内容"
              extra="支持富文本编辑，可以添加文字、图片、链接等"
            >
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="请输入课程学习内容..."
                style={{ minHeight: "200px" }}
              />
            </Form.Item>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Button onClick={() => navigate("/courses")} size="large">
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<SaveOutlined />}
              size="large"
            >
              {isEditing ? "更新课程" : "创建课程"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* 媒体资源预览模态框 */}
      <Modal
        title="媒体资源预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {previewResource && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{previewResource.title}</h3>
              {previewResource.description && (
                <p className="text-gray-600 mb-4">{previewResource.description}</p>
              )}
            </div>
            
            <div className="text-center">
              {previewResource.resourceType === 'video' ? (
                <video
                  src={previewResource.resourceUrl}
                  controls
                  className="max-w-full max-h-96 rounded-lg"
                  poster={previewResource.thumbnailUrl}
                >
                  您的浏览器不支持视频播放
                </video>
              ) : (
                <Image
                  src={previewResource.resourceUrl}
                  alt={previewResource.title}
                  className="max-w-full rounded-lg"
                  style={{ maxHeight: '400px' }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>资源类型：</strong> 
                {previewResource.resourceType === 'video' ? '视频' : '图片'}
              </div>
              <div>
                <strong>发布状态：</strong> 
                <Tag 
                  color={previewResource.status === 'published' ? 'green' : 'orange'}
                  className="ml-1"
                >
                  {previewResource.status === 'published' ? '已发布' : '待发布'}
                </Tag>
              </div>
              {previewResource.duration && (
                <div>
                  <strong>视频时长：</strong> {Math.floor(previewResource.duration / 60)}分{previewResource.duration % 60}秒
                </div>
              )}
              {previewResource.fileSize && (
                <div>
                  <strong>文件大小：</strong> {(previewResource.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>

            {previewResource.tags && previewResource.tags.length > 0 && (
              <div>
                <strong className="text-sm text-gray-600 mr-2">标签：</strong>
                {previewResource.tags.map((tag: string, index: number) => (
                  <Tag key={index} className="mb-1">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CourseForm;
