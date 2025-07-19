import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Popconfirm,
  message,
  Select,
  Typography,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  getAllExercises,
  deleteExercise,
  getStatusOptions,
  updateExercise,
  type ExerciseFilters,
} from "../../services/exerciseService";
import { getCourses } from "../../services/courseService";
import { getSubjects } from "../../services/subjectService";
import { getGrades } from "../../services/gradeService";
import { createAIGenerateSingleExerciseTask } from "../../services/taskService";
import { useUser } from "../../contexts/UserContext";
import type { Exercise } from "../../services/exerciseService";

const { Option } = Select;
const { Title } = Typography;

// 题目类型选项
const questionTypes = [
  { value: "choice", label: "选择题" },
  { value: "fill_blank", label: "填空题" },
  { value: "application", label: "应用题" },
  { value: "matching", label: "匹配题" },
];

// 难度选项
const difficultyOptions = [
  { value: 1, label: "简单" },
  { value: 2, label: "中等" },
  { value: 3, label: "困难" },
];

const ExerciseList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | undefined>(
    undefined
  );
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState<string | undefined>(
    undefined
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // AI生成相关状态
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState<"select" | "form">("select");
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [aiForm] = Form.useForm();
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // 权限检查
  const canModifyStatus = () => {
    return user && ["admin", "superadmin"].includes(user.role || "");
  };

  // 处理状态变更
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdating(id);
      await updateExercise(id, { status: newStatus as any });
      message.success("状态更新成功");
      fetchExercises();
    } catch (error) {
      console.error("更新状态失败:", error);
      message.error("更新状态失败");
    } finally {
      setUpdating(null);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      ellipsis: true,
    },
    {
      title: "习题标题",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
      render: (title: string, record: Exercise) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">
            {questionTypes.find((t) => t.value === record.type)?.label}
          </div>
        </div>
      ),
    },
    {
      title: "关联信息",
      key: "relationInfo",
      width: 280,
      render: (record: Exercise) => {
        const hasRelation = record.subjectInfo || record.grade || record.unit || record.course;
        
        if (!hasRelation) {
          return <span className="text-gray-400">无关联信息</span>;
        }
        
        return (
          <div className="text-xs">
            <div className="border rounded p-2 bg-gray-50">
              <div className="flex flex-wrap gap-1 mb-2">
                {record.grade && (
                  <Tag color="blue">{record.grade.name}</Tag>
                )}
                {record.subjectInfo && (
                  <Tag color="green">{record.subjectInfo.name}</Tag>
                )}
              </div>
              {record.unit && (
                <div className="mb-1">
                  <span className="text-gray-500">单元：</span>
                  <Tag color="purple">{record.unit.title}</Tag>
                </div>
              )}
              {record.course && (
                <div className="font-medium text-gray-700 truncate" title={record.course.title}>
                  课程：{record.course.title}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: "难度",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 80,
      render: (difficulty: number) => (
        <Tag
          color={
            difficulty === 1 ? "green" : difficulty === 2 ? "orange" : "red"
          }
        >
          {difficultyOptions.find((d) => d.value === difficulty)?.label}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string, record: Exercise) => {
        const statusConfig = getStatusOptions().find((s) => s.value === status);
        return <Tag color={statusConfig?.color}>{statusConfig?.label}</Tag>;
      },
    },
    {
      title: "创建者",
      dataIndex: "creator",
      key: "creator",
      width: 100,
      render: (creator: any) => creator?.name || creator?.username || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right" as const,
      render: (text: any, record: Exercise) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/exercises/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个习题吗？"
            onConfirm={() => handleDelete(record.id as string)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ExerciseFilters = {
        search: searchText || undefined,
        subject: subjectFilter || undefined,
        type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined,
        status: statusFilter || undefined,
        gradeId: gradeFilter || undefined,
        courseId: courseFilter || undefined,
      };

      const exercisesData = await getAllExercises(filters);
      if (Array.isArray(exercisesData)) {
        setExercises(exercisesData);
      } else {
        setExercises([]);
      }
    } catch (error) {
      console.error("加载习题数据失败:", error);
      message.error("加载习题数据失败");
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [
    searchText,
    subjectFilter,
    typeFilter,
    difficultyFilter,
    statusFilter,
    gradeFilter,
    courseFilter,
  ]);

  // 加载基础数据
  const fetchBasicData = useCallback(async () => {
    try {
      const [coursesData, subjectsData, gradesData] = await Promise.all([
        getCourses(),
        getSubjects(),
        getGrades(),
      ]);
      setCourses(coursesData || []);
      setSubjects(subjectsData || []);
      setGrades(gradesData || []);
    } catch (error) {
      console.error("加载基础数据失败:", error);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    fetchBasicData();
  }, [fetchBasicData]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const success = await deleteExercise(id);

      if (success) {
        message.success("习题删除成功");
        fetchExercises();
      } else {
        message.error("删除习题失败");
      }
    } catch (error) {
      console.error("删除习题出错:", error);
      message.error("删除习题时发生错误");
    } finally {
      setDeleting(null);
    }
  };

  // AI生成相关函数
  const handleAiModalOpen = () => {
    setAiModalVisible(true);
    setAiStep("select");
    aiForm.resetFields();
  };

  const handleAiModalClose = () => {
    setAiModalVisible(false);
    setAiStep("select");
    aiForm.resetFields();
    setAiGenerating(false);
    setSelectedSubject("");
    setFilteredCourses([]);
  };

  const handleSelectGenerationType = (type: string) => {
    if (type === "info") {
      setAiStep("form");
    } else {
      message.info("上传图片生成功能暂未开放");
    }
  };

  const handleSubjectChange = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    const filtered = courses.filter((course) => course.subject === subjectCode);
    setFilteredCourses(filtered);
    aiForm.setFieldsValue({ courseId: undefined });
  };

  const handleAiGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      const { subject, gradeId, type, courseId, relevance, difficulty } =
        values;

      setAiGenerating(true);

      const task = await createAIGenerateSingleExerciseTask({
        subject,
        gradeId,
        type,
        courseId,
        relevance,
        difficulty,
      });

      message.success("任务已创建，正在后台生成中，请在任务管理中查看进度");
      handleAiModalClose();
    } catch (error) {
      console.error("创建AI生成单个习题任务失败:", error);
      message.error("创建任务失败，请重试");
    } finally {
      setAiGenerating(false);
    }
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchText("");
    setSubjectFilter(undefined);
    setTypeFilter(undefined);
    setDifficultyFilter(undefined);
    setStatusFilter(undefined);
    setGradeFilter(undefined);
    setCourseFilter(undefined);
  };

  return (
    <div>
      {/* 标题栏区域 */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center">
          <BookOutlined className="mr-2 text-2xl text-blue-500" />
          <Title level={2} style={{ margin: 0 }}>
            习题管理
          </Title>
        </div>
        <div className="flex items-center">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/exercises/new")}
            size="large"
          >
            添加习题
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleAiModalOpen}
            size="large"
            className="ml-2"
          >
            AI生成
          </Button>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <Card className="mb-6 shadow-sm rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-gray-600 mb-1">习题标题</div>
            <Input
              placeholder="输入习题标题关键词"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </div>

          <div>
            <div className="text-gray-600 mb-1">学科筛选</div>
            <Select
              placeholder="选择学科"
              style={{ width: "100%" }}
              value={subjectFilter}
              onChange={setSubjectFilter}
              allowClear
              size="large"
            >
              {subjects.map((subject) => (
                <Option key={subject.code} value={subject.code}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div className="text-gray-600 mb-1">年级筛选</div>
            <Select
              placeholder="选择年级"
              style={{ width: "100%" }}
              value={gradeFilter}
              onChange={setGradeFilter}
              allowClear
              size="large"
            >
              {grades.map((grade) => (
                <Option key={grade.id} value={grade.id}>
                  {grade.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div className="text-gray-600 mb-1">题型筛选</div>
            <Select
              placeholder="选择题型"
              style={{ width: "100%" }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              size="large"
            >
              {questionTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-600 mb-1">难度筛选</div>
            <Select
              placeholder="选择难度"
              style={{ width: "100%" }}
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              allowClear
              size="large"
            >
              {difficultyOptions.map((option) => (
                <Option key={option.value} value={option.value.toString()}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div className="text-gray-600 mb-1">状态筛选</div>
            <Select
              placeholder="选择状态"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              size="large"
            >
              {getStatusOptions().map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div className="text-gray-600 mb-1">课程筛选</div>
            <Select
              placeholder="选择课程"
              style={{ width: "100%" }}
              value={courseFilter}
              onChange={setCourseFilter}
              allowClear
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {courses.map((course) => (
                <Option key={course.id} value={course.id}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleResetFilters}
              size="large"
              className="w-full"
            >
              重置筛选
            </Button>
          </div>
        </div>
      </Card>

      {/* 习题表格 */}
      <Card className="shadow-sm rounded-lg">
        <Table
          columns={columns}
          dataSource={exercises}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText:
              searchText ||
              subjectFilter ||
              typeFilter ||
              difficultyFilter ||
              statusFilter ||
              gradeFilter ||
              courseFilter
                ? "没有找到符合筛选条件的习题"
                : "暂无习题数据，请点击添加按钮创建新习题",
          }}
        />
      </Card>

      {/* AI生成弹窗 */}
      <Modal
        title="AI一键生成习题"
        open={aiModalVisible}
        onCancel={handleAiModalClose}
        footer={null}
        width={600}
        destroyOnClose
      >
        {aiStep === "select" ? (
          <div className="py-8">
            <div className="text-center mb-6">
              <RobotOutlined className="text-4xl text-blue-500 mb-4" />
              <Title level={3}>选择生成方式</Title>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card
                  hoverable
                  className="text-center h-full border-2 border-dashed border-gray-300"
                  onClick={() => handleSelectGenerationType("upload")}
                >
                  <div className="text-5xl mb-4">📷</div>
                  <Title level={4} className="mb-2">
                    上传图片生成
                  </Title>
                  <Button size="small" disabled>
                    暂未开放
                  </Button>
                </Card>
              </Col>

              <Col span={12}>
                <Card
                  hoverable
                  className="text-center h-full border-2 border-solid border-blue-200"
                  onClick={() => handleSelectGenerationType("info")}
                >
                  <div className="text-5xl mb-4">📝</div>
                  <Title level={4} className="mb-2">
                    信息生成
                  </Title>
                  <Button type="primary" size="small">
                    立即体验
                  </Button>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="py-4">
            <Form form={aiForm} layout="vertical" onFinish={handleAiGenerate}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="选择学科"
                    name="subject"
                    rules={[{ required: true, message: "请选择学科" }]}
                  >
                    <Select
                      placeholder="请选择学科"
                      size="large"
                      onChange={handleSubjectChange}
                    >
                      {subjects.map((subject) => (
                        <Option key={subject.code} value={subject.code}>
                          {subject.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="选择年级（可选）" name="gradeId">
                    <Select placeholder="请选择年级" size="large" allowClear>
                      {grades.map((grade) => (
                        <Option key={grade.id} value={grade.id}>
                          {grade.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="题目类型"
                    name="type"
                    rules={[{ required: true, message: "请选择题目类型" }]}
                  >
                    <Select placeholder="请选择题目类型" size="large">
                      {questionTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="相关课程（可选）" name="courseId">
                <Select
                  placeholder={
                    selectedSubject ? "请选择相关课程" : "请先选择学科"
                  }
                  size="large"
                  disabled={!selectedSubject}
                  allowClear
                >
                  {filteredCourses.map((course) => (
                    <Option key={course.id} value={course.id}>
                      {course.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="题目相关性" name="relevance">
                    <Input
                      placeholder="例如：函数、方程等（可选）"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="题目难度"
                    name="difficulty"
                    initialValue={2}
                  >
                    <Select placeholder="请选择难度" size="large">
                      {difficultyOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item className="mb-0 mt-6">
                <Space className="w-full justify-center">
                  <Button onClick={handleAiModalClose} size="large">
                    取消
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={aiGenerating}
                    size="large"
                    icon={<RobotOutlined />}
                  >
                    {aiGenerating ? "正在生成中..." : "开始生成"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExerciseList;
