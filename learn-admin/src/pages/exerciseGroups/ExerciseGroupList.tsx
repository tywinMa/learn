import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  message,
  Modal,
  Card,
  Tag,
  Tooltip,
  Form,
  Row,
  Col,
  Spin,
  Typography,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ExerciseGroup } from "../../services/exerciseGroupService";
import {
  getExerciseGroups,
  deleteExerciseGroup,
  createExerciseGroup,
  updateExerciseGroup,
} from "../../services/exerciseGroupService";
import { getSubjects } from "../../services/subjectService";
import { getCourses } from "../../services/courseService";
import { createExercise } from "../../services/exerciseService";
import { getChoiceExerciseList, getFillBlankExerciseList, getMatchingExerciseList } from "../../services/aiService";

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const ExerciseGroupList: React.FC = () => {
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);

  // AI生成相关状态
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiStep, setAiStep] = useState<"select" | "form">("select");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [aiForm] = Form.useForm();

  const navigate = useNavigate();

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      const subjectList = await getSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error("获取学科列表失败:", error);
    }
  };

  // 获取课程列表
  const fetchCourses = async () => {
    try {
      const courseList = await getCourses();
      setCourses(courseList || []);
    } catch (error) {
      console.error("获取课程列表失败:", error);
    }
  };

  // 获取习题组列表
  const fetchExerciseGroups = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(searchName && { name: searchName }),
        ...(searchSubject && { subject: searchSubject }),
      };

      console.log("🔍 ExerciseGroupList - 开始获取习题组列表，参数:", params);
      const response = await getExerciseGroups(params);
      console.log("📦 ExerciseGroupList - API响应数据:", response);
      console.log("📋 ExerciseGroupList - 习题组列表:", response.exerciseGroups);
      console.log("📊 ExerciseGroupList - 总数:", response.total);

      setExerciseGroups(response.exerciseGroups);
      setTotal(response.total);
    } catch (error) {
      console.error("❌ ExerciseGroupList - 获取习题组列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // AI生成习题组相关函数
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

  const getSubjectName = (subjectCode: string) => {
    const subject = subjects.find((s) => s.code === subjectCode);
    return subject?.name || subjectCode;
  };

  const handleAiGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      const { groupName, subject, type, courseId, relevance, difficulty, questionCount } = values;

      setAiGenerating(true);

      // 找到选中的课程信息
      const selectedCourse = courses.find((course) => course.id === courseId);
      const courseName = selectedCourse?.title || "通用课程";

      // 找到选中的学科信息
      const subjectName = getSubjectName(subject);

      console.log("开始AI生成习题组，参数:", {
        groupName,
        subject,
        subjectName,
        courseName,
        relevance,
        difficulty,
        questionCount,
      });

      // 根据题目类型调用不同的AI生成接口获取习题列表
      let aiExercises;
      if (type === 'choice') {
        aiExercises = await getChoiceExerciseList(subjectName, courseName, relevance, difficulty, questionCount);
      } else if (type === 'fill_blank') {
        aiExercises = await getFillBlankExerciseList(subjectName, courseName, relevance, difficulty, questionCount);
      } else if (type === 'matching') {
        aiExercises = await getMatchingExerciseList(subjectName, courseName, relevance, difficulty, questionCount);
      } else {
        message.warning("目前只支持生成选择题、填空题和匹配题");
        return;
      }

      console.log("AI生成的习题列表:", aiExercises);

      if (!Array.isArray(aiExercises) || aiExercises.length === 0) {
        message.error("AI生成习题失败，请重试");
        return;
      }

      // 根据用户选择的数量截取题目
      const selectedExercises = aiExercises.slice(0, questionCount);
      console.log(
        `用户选择生成${questionCount}道题，实际可用题目${aiExercises.length}道，最终使用${selectedExercises.length}道`
      );

      // 1. 首先创建习题组
      const exerciseGroupData = {
        id: `${subject}-group-${Date.now()}`,
        name: groupName,
        description: `AI自动生成的${subjectName}习题组（共${selectedExercises.length}道题）`,
        subject: subject,
        exerciseIds: [],
        isActive: true,
      };

      const groupCreated = await createExerciseGroup(exerciseGroupData);
      if (!groupCreated) {
        message.error("创建习题组失败");
        return;
      }

      const groupId = exerciseGroupData.id; // 使用我们指定的ID
      console.log("成功创建习题组，ID:", groupId);

      // 2. 批量创建习题
      const createdExerciseIds: string[] = [];
      for (let i = 0; i < selectedExercises.length; i++) {
        const aiExercise = selectedExercises[i];
        try {
          let exerciseData;
          
          if (type === 'choice') {
            // 处理选择题格式
            let processedOptions = aiExercise.options;
            let correctAnswer = aiExercise.correctAnswer;

            if (Array.isArray(aiExercise.options)) {
              // 将AI格式转换为系统格式
              processedOptions = aiExercise.options.map((option: any) => option.text || option.content || String(option));

              // 确保correctAnswer是数字索引
              if (typeof correctAnswer !== "number") {
                correctAnswer = aiExercise.options.findIndex((opt: any) => opt.isCorrect === true);
                if (correctAnswer === -1) correctAnswer = 0;
              }
            }

            exerciseData = {
              subject: subject,
              title: aiExercise.title || `习题${i + 1}`,
              question: aiExercise.question || "",
              type: aiExercise.type || "choice",
              difficulty: aiExercise.difficulty || 2,
              options: processedOptions,
              correctAnswer: correctAnswer,
              explanation: aiExercise.explanation || "",
              isAI: true,
            };
          } else if (type === 'fill_blank') {
            // 处理填空题格式
            exerciseData = {
              subject: subject,
              title: aiExercise.title || `习题${i + 1}`,
              question: aiExercise.question || "",
              type: aiExercise.type || "fill_blank",
              difficulty: aiExercise.difficulty || 2,
              options: null, // 填空题不需要选项
              correctAnswer: Array.isArray(aiExercise.correctAnswer) ? aiExercise.correctAnswer : [aiExercise.correctAnswer || ''], // 确保填空题答案是数组
              explanation: aiExercise.explanation || "",
              isAI: true,
            };
          } else if (type === 'matching') {
            // 处理匹配题格式
            exerciseData = {
              subject: subject,
              title: aiExercise.title || `习题${i + 1}`,
              question: aiExercise.question || "",
              type: aiExercise.type || "matching",
              difficulty: aiExercise.difficulty || 2,
              options: aiExercise.options || [],
              correctAnswer: aiExercise.correctAnswer || [],
              explanation: aiExercise.explanation || "",
              isAI: true,
            };
          } else {
            console.error(`不支持的题目类型: ${type}`);
            continue;
          }

          console.log(`创建第${i + 1}个习题:`, exerciseData);
          const createdExercise = await createExercise(exerciseData);

          if (createdExercise && createdExercise.id) {
            createdExerciseIds.push(String(createdExercise.id));
          }
        } catch (error) {
          console.error(`创建第${i + 1}个习题失败:`, error);
        }
      }

      console.log("创建的习题ID列表:", createdExerciseIds);

      // 3. 更新习题组，添加习题ID
      if (createdExerciseIds.length > 0) {
        console.log(`开始更新习题组${groupId}，添加${createdExerciseIds.length}个习题ID`);
        const updateSuccess = await updateExerciseGroup(groupId, {
          exerciseIds: createdExerciseIds,
        });

        if (updateSuccess) {
          message.success(`AI生成习题组成功！共创建了${createdExerciseIds.length}道习题并已添加到习题组中`);
        } else {
          message.warning(`创建了${createdExerciseIds.length}道习题，但添加到习题组时出现问题，请手动检查`);
        }

        // 刷新习题组列表
        fetchExerciseGroups();
        handleAiModalClose();
      } else {
        message.warning("习题组创建成功，但习题生成失败，请手动添加习题");
        fetchExerciseGroups();
        handleAiModalClose();
      }
    } catch (error) {
      console.error("AI生成习题组失败:", error);
      message.error("AI生成习题组失败，请重试");
    } finally {
      setAiGenerating(false);
    }
  };

  // 处理学科选择变化
  const handleSubjectChange = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    // 根据选择的学科过滤课程
    const filtered = courses.filter((course) => course.subject === subjectCode);
    setFilteredCourses(filtered);
    // 清空课程选择
    aiForm.setFieldsValue({ courseId: undefined });
  };

  useEffect(() => {
    fetchSubjects();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchExerciseGroups();
  }, [currentPage, pageSize, searchName, searchSubject]);

  // 删除习题组
  const handleDelete = (record: ExerciseGroup) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除习题组"${record.name}"吗？`,
      okText: "确定",
      cancelText: "取消",
      onOk: async () => {
        const success = await deleteExerciseGroup(record.id);
        if (success) {
          fetchExerciseGroups();
        }
      },
    });
  };

  // 重置搜索
  const handleReset = () => {
    setSearchName("");
    setSearchSubject("");
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "习题组ID",
      dataIndex: "id",
      key: "id",
      width: 150,
    },
    {
      title: "习题组名称",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "学科",
      dataIndex: "Subject",
      key: "subject",
      width: 120,
      render: (subject: any) => <Tag color="blue">{subject?.name || "未知学科"}</Tag>,
    },
    {
      title: "习题数量",
      dataIndex: "exerciseCount",
      key: "exerciseCount",
      width: 100,
      render: (count: number) => <Tag color={count > 0 ? "green" : "default"}>{count || 0}道</Tag>,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span>{text || "暂无描述"}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      width: 80,
      render: (isActive: boolean) => <Tag color={isActive ? "green" : "red"}>{isActive ? "启用" : "禁用"}</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_: any, record: ExerciseGroup) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/exercise-groups/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/exercise-groups/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Search
            placeholder="搜索习题组名称"
            allowClear
            style={{ width: 200 }}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onSearch={fetchExerciseGroups}
          />
          <Select
            placeholder="选择学科"
            allowClear
            style={{ width: 150 }}
            value={searchSubject}
            onChange={setSearchSubject}
          >
            {subjects.map((subject) => (
              <Option key={subject.code} value={subject.code}>
                {subject.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchExerciseGroups}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/exercise-groups/new")}>
            新增习题组
          </Button>
          <Button type="primary" icon={<RobotOutlined />} onClick={handleAiModalOpen} style={{ marginLeft: 8 }}>
            AI生成习题组
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={exerciseGroups}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
        }}
      />

      {/* AI生成弹窗 */}
      <Modal
        title="AI一键生成习题组"
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
              <Text type="secondary">请选择适合您的习题组生成方式</Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card
                  hoverable
                  className="text-center h-full border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300"
                  onClick={() => handleSelectGenerationType("upload")}
                  bodyStyle={{ padding: "32px 16px" }}
                >
                  <div className="text-5xl mb-4">📷</div>
                  <Title level={4} className="mb-2">
                    上传图片生成
                  </Title>
                  <Text type="secondary" className="text-sm">
                    上传题目图片，AI智能识别并生成习题组
                  </Text>
                  <div className="mt-4">
                    <Button size="small" disabled>
                      暂未开放
                    </Button>
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card
                  hoverable
                  className="text-center h-full border-2 border-solid border-blue-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                  onClick={() => handleSelectGenerationType("info")}
                  bodyStyle={{ padding: "32px 16px" }}
                >
                  <div className="text-5xl mb-4">📝</div>
                  <Title level={4} className="mb-2">
                    信息生成
                  </Title>
                  <Text type="secondary" className="text-sm">
                    根据学科、课程等信息智能生成习题组
                  </Text>
                  <div className="mt-4">
                    <Button type="primary" size="small">
                      立即体验
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="py-4">
            <Form form={aiForm} layout="vertical" onFinish={handleAiGenerate}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="习题组名称"
                    name="groupName"
                    rules={[{ required: true, message: "请输入习题组名称" }]}
                  >
                    <Input placeholder="请输入习题组名称" size="large" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="选择学科" name="subject" rules={[{ required: true, message: "请选择学科" }]}>
                    <Select placeholder="请选择学科" size="large" onChange={handleSubjectChange}>
                      {subjects.map((subject) => (
                        <Option key={subject.code} value={subject.code}>
                          {subject.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="题目类型" name="type" rules={[{ required: true, message: "请选择题目类型" }]}>
                    <Select placeholder="请选择题目类型" size="large">
                      <Option value="choice">选择题</Option>
                      <Option value="fill_blank">填空题</Option>
                      <Option value="matching">匹配题</Option>
                      <Option value="application" disabled>
                        应用题（暂未支持）
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="相关课程" name="courseId" rules={[{ required: true, message: "请选择相关课程" }]}>
                    <Select
                      placeholder={selectedSubject ? "请选择相关课程" : "请先选择学科"}
                      size="large"
                      disabled={!selectedSubject}
                    >
                      {filteredCourses.map((course) => (
                        <Option key={course.id} value={course.id}>
                          {course.title}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="题目相关性" name="relevance">
                    <Input placeholder="例如：函数、方程等（可选）" size="large" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="题目数量"
                    name="questionCount"
                    initialValue={5}
                    rules={[{ required: true, message: "请输入题目数量" }]}
                  >
                    <InputNumber placeholder="请输入题目数量" size="large" min={1} max={50} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="题目难度" name="difficulty" initialValue={2}>
                    <Select placeholder="请选择难度" size="large">
                      <Option value={1}>简单</Option>
                      <Option value={2}>中等</Option>
                      <Option value={3}>困难</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item className="mb-0 mt-6">
                <Space className="w-full justify-center">
                  <Button onClick={handleAiModalClose} size="large">
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit" loading={aiGenerating} size="large" icon={<RobotOutlined />}>
                    {aiGenerating ? "正在生成中..." : "开始生成"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ExerciseGroupList;
