import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Radio,
  Space,
  Divider,
  message,
  Spin,
  Typography,
  Row,
  Col,
  Transfer,
  Switch,
  Tag,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./ExerciseForm.css";
import {
  getExerciseById,
  createExercise,
  updateExercise,
  getStatusOptions,
  getStatusLabel,
} from "../../services/exerciseService";
import { getStatusColor, type StatusValue } from "../../constants/status";
import { getCourses } from "../../services/courseService";
import { getKnowledgePointsForSelect } from "../../services/knowledgePointService";
import { getSubjects } from "../../services/subjectService";
import { getGrades } from "../../services/gradeService";
import { getAllUnits } from "../../services/unitService";
import { useUser } from "../../contexts/UserContext";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

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

interface FormValues {
  title: string;
  type: string;
  difficulty: number;
  subject: string;
  gradeId: number;
  unitId: string;
  courseId: string;
  question: string;
  explanation: string;
  options?: string[];
  correctAnswer?: string;
  keywords?: string;
  knowledgePoints?: string[];
  status?: string;
}

const ExerciseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useUser();

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 基础数据状态
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([]);

  // 选择状态
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // Transfer组件相关状态
  const [knowledgePointsData, setKnowledgePointsData] = useState<any[]>([]);
  const [selectedKnowledgePointKeys, setSelectedKnowledgePointKeys] = useState<
    string[]
  >([]);

  // 当前习题数据
  const [currentExercise, setCurrentExercise] = useState<any>(null);

  // 权限检查
  const canModifyStatus = () => {
    return user && ["admin", "superadmin"].includes(user.role || "");
  };

  const canEdit = () => {
    if (!currentExercise) return true; // 新增模式总是可编辑
    if (canModifyStatus()) return true; // 管理员可以编辑任何状态
    return (
      currentExercise.createdBy === user?.id &&
      ["draft", "rejected"].includes(currentExercise.status)
    );
  };

  const canSubmit = () => {
    if (!currentExercise) return true; // 新增模式可以提交
    if (canModifyStatus()) return true; // 管理员可以提交任何状态
    return (
      currentExercise.createdBy === user?.id &&
      ["draft", "rejected"].includes(currentExercise.status)
    );
  };

  // 判断是否可以编辑课程关联设置（只有管理员或新增模式可以编辑）
  const canEditCourseAssociation = () => {
    return !currentExercise || canModifyStatus(); // 新增模式或管理员可以编辑
  };

  // 加载基础数据
  useEffect(() => {
    loadGrades();
    loadSubjects();
    loadKnowledgePoints();

    if (isEditMode && id) {
      loadExerciseData(id);
    }
  }, [isEditMode, id]);

  const loadGrades = async () => {
    try {
      const gradesData = await getGrades();
      setGrades(gradesData);
    } catch (error) {
      console.error("加载年级数据失败:", error);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjectsData = await getSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error("加载学科数据失败:", error);
    }
  };

  const loadUnits = async (gradeId: string, subjectCode: string) => {
    try {
      const allUnits = await getAllUnits();
      const filteredUnits = allUnits.filter((unit) => {
        if (unit.subjectGrade) {
          return (
            unit.subjectGrade.gradeId === parseInt(gradeId) &&
            unit.subjectGrade.subjectCode === subjectCode
          );
        }
        return false;
      });
      setUnits(filteredUnits);
      return filteredUnits;
    } catch (error) {
      console.error("加载单元数据失败:", error);
      message.error("加载单元数据失败");
      return [];
    }
  };

  const loadCoursesByUnit = async (unitId: string) => {
    try {
      // 找到选中的单元
      const selectedUnitObj = units.find((unit) => unit.id === unitId);
      if (
        !selectedUnitObj ||
        !selectedUnitObj.courseIds ||
        selectedUnitObj.courseIds.length === 0
      ) {
        console.log("未找到单元或单元没有课程关联:", unitId);
        console.log(
          "可用的单元列表:",
          units.map((u) => ({
            id: u.id,
            title: u.title,
            courseIds: u.courseIds,
          }))
        );
        setCourses([]);
        return;
      }

      console.log("=== 根据单元筛选课程调试信息 ===");
      console.log("选中的单元:", selectedUnitObj);
      console.log("单元包含的课程ID:", selectedUnitObj.courseIds);
      console.log("单元courseIds类型:", typeof selectedUnitObj.courseIds[0]);

      // 获取所有课程
      const allCourses = await getCourses();
      console.log("获取到的所有课程数量:", allCourses.length);
      console.log(
        "前几个课程示例:",
        allCourses
          .slice(0, 3)
          .map((c) => ({ id: c.id, title: c.title, idType: typeof c.id }))
      );

      // 根据单元的courseIds筛选课程
      const filteredCourses = allCourses.filter((course) =>
        selectedUnitObj.courseIds?.includes(course.id)
      );

      console.log(`根据单元${unitId}筛选课程结果:`, filteredCourses);
      console.log("筛选出的课程数量:", filteredCourses.length);

      // 逐个检查为什么课程没有被筛选出来
      if (filteredCourses.length === 0) {
        console.log("没有筛选出课程，详细检查原因:");
        selectedUnitObj.courseIds.forEach((unitCourseId: string) => {
          const matchedCourse = allCourses.find(
            (course) => course.id === unitCourseId
          );
          console.log(
            `  期望课程ID "${unitCourseId}" (${typeof unitCourseId}) -> ${
              matchedCourse ? "找到" : "未找到"
            }`
          );
          if (!matchedCourse) {
            // 尝试类型转换匹配
            const stringMatchedCourse = allCourses.find(
              (course) => String(course.id) === String(unitCourseId)
            );
            console.log(
              `    字符串匹配尝试: ${stringMatchedCourse ? "找到" : "未找到"}`
            );
          }
        });
        console.log(
          "所有课程的ID:",
          allCourses.map((c) => c.id)
        );
      }

      console.log("=== 根据单元筛选课程调试信息结束 ===");
      setCourses(filteredCourses);
    } catch (error) {
      console.error("根据单元加载课程数据失败:", error);
      message.error("根据单元加载课程数据失败");
    }
  };

  const loadKnowledgePoints = async () => {
    try {
      const kpData = await getKnowledgePointsForSelect();
      setKnowledgePoints(kpData);
      setKnowledgePointsData(
        kpData.map((kp) => ({
          key: kp.id,
          title: kp.title,
        }))
      );
    } catch (error) {
      console.error("加载知识点数据失败:", error);
    }
  };

  const loadExerciseData = async (exerciseId: string) => {
    try {
      setLoading(true);
      const exercise = await getExerciseById(exerciseId);
      if (!exercise) {
        message.error("习题数据不存在");
        return;
      }

      setCurrentExercise(exercise);

      // 设置表单数据
      form.setFieldsValue({
        title: exercise.title,
        type: exercise.type,
        difficulty: exercise.difficulty,
        subject: exercise.subject,
        gradeId: exercise.gradeId,
        unitId: exercise.unitId,
        courseId: exercise.courseId,
        question: exercise.question,
        explanation: exercise.explanation,
        options: exercise.options || [],
        correctAnswer: exercise.correctAnswer,

        status: exercise.status,
      });

      // 设置关联数据
      if (exercise.gradeId && exercise.subject) {
        setSelectedGrade(exercise.gradeId.toString());
        setSelectedSubject(exercise.subject);
        await loadUnits(exercise.gradeId.toString(), exercise.subject);
      }

      if (exercise.unitId) {
        setSelectedUnit(exercise.unitId);
        // 设置单元后加载对应的课程数据
        await loadCoursesByUnit(exercise.unitId);
      }

      if (exercise.courseId) {
        setSelectedCourse(exercise.courseId);
      }

      // 设置知识点
      if (exercise.knowledgePointIds) {
        setSelectedKnowledgePointKeys(exercise.knowledgePointIds);
      }
    } catch (error) {
      console.error("加载习题数据失败:", error);
      message.error("加载习题数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 年级选择处理
  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId.toString());
    setSelectedSubject("");
    setSelectedUnit("");
    setSelectedCourse("");
    setUnits([]);
    setCourses([]);
    form.setFieldsValue({
      subject: undefined,
      unitId: undefined,
      courseId: undefined,
    });
  };

  // 学科选择处理
  const handleSubjectChange = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setSelectedUnit("");
    setSelectedCourse("");
    setCourses([]);
    form.setFieldsValue({ unitId: undefined, courseId: undefined });

    if (selectedGrade && subjectCode) {
      loadUnits(selectedGrade, subjectCode);
      // 课程现在通过单元加载，清空课程列表
      setCourses([]);
    }
  };

  // 单元选择处理
  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedCourse("");
    form.setFieldsValue({ courseId: undefined });

    // 选择单元后，根据单元的courseIds来加载课程
    if (unitId) {
      loadCoursesByUnit(unitId);
    }
  };

  // 课程选择处理
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  // 保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const data = {
        ...values,
        knowledgePointIds: selectedKnowledgePointKeys,
        status:
          canModifyStatus() && isEditMode && values.status
            ? (values.status as StatusValue)
            : ("draft" as StatusValue),
      };

      if (isEditMode && id) {
        await updateExercise(id, data);
        message.success("习题保存成功");
      } else {
        await createExercise(data);
        message.success("习题创建成功");
        navigate("/exercises");
      }
    } catch (error) {
      console.error("保存习题失败:", error);
      message.error("保存习题失败");
    } finally {
      setSaving(false);
    }
  };

  // 提交审核
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 管理员在编辑模式下可以自定义状态，其他情况按原逻辑
      const status = canModifyStatus()
        ? (values.status as StatusValue)
        : ("pending" as StatusValue);

      const data = {
        ...values,
        knowledgePointIds: selectedKnowledgePointKeys,
        status,
      };

      if (isEditMode && id) {
        await updateExercise(id, data);
        message.success(
          canModifyStatus() && currentExercise
            ? "习题状态修改成功"
            : "习题提交审核成功"
        );
      } else {
        await createExercise(data);
        message.success(
          canModifyStatus() ? "习题发布成功" : "习题提交审核成功"
        );
        navigate("/exercises");
      }
    } catch (error) {
      console.error("提交习题失败:", error);
      message.error("提交习题失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="exercise-form-container">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/exercises")}
            >
              返回
            </Button>
            <Title level={3} className="mb-0">
              {isEditMode ? "编辑习题" : "创建习题"}
            </Title>
          </div>
        </div>

        {/* 状态显示 */}
        {currentExercise && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">当前状态：</span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  currentExercise.status === "published"
                    ? "bg-green-100 text-green-800"
                    : currentExercise.status === "pending"
                    ? "bg-blue-100 text-blue-800"
                    : currentExercise.status === "under_review"
                    ? "bg-yellow-100 text-yellow-800"
                    : currentExercise.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {getStatusLabel(currentExercise.status)}
              </span>
            </div>
            {!canEdit() && (
              <div className="mt-2 text-xs text-gray-500">
                当前状态下无法编辑习题内容
              </div>
            )}
          </div>
        )}

        <Form form={form} layout="vertical" disabled={!canEdit()}>
          {/* 课程关联选择区域 - 只有新增或管理员可以编辑 */}
          {canEditCourseAssociation() ? (
            <Card
              size="small"
              className="mb-6"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <div className="mb-3">
                <h4 className="text-base font-medium text-gray-900 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  课程关联设置
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （必须关联到具体课程）
                  </span>
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="gradeId"
                  label="年级"
                  rules={[{ required: true, message: "请选择年级" }]}
                >
                  <Select
                    placeholder="选择年级"
                    onChange={handleGradeChange}
                    disabled={!canEdit()}
                  >
                    {grades.map((grade) => (
                      <Option key={grade.id} value={grade.id}>
                        {grade.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="subject"
                  label="学科"
                  rules={[{ required: true, message: "请选择学科" }]}
                >
                  <Select
                    placeholder="选择学科"
                    onChange={handleSubjectChange}
                    disabled={!selectedGrade || !canEdit()}
                  >
                    {subjects.map((subject) => (
                      <Option key={subject.code} value={subject.code}>
                        {subject.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="unitId"
                  label="单元"
                  rules={[{ required: true, message: "请选择单元" }]}
                >
                  <Select
                    placeholder="选择单元"
                    onChange={handleUnitChange}
                    disabled={!selectedSubject || !canEdit()}
                  >
                    {units.map((unit) => (
                      <Option key={unit.id} value={unit.id}>
                        {unit.title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="courseId"
                  label="课程"
                  rules={[{ required: true, message: "请选择课程" }]}
                >
                  <Select
                    placeholder="选择课程"
                    onChange={handleCourseChange}
                    disabled={!selectedSubject || !canEdit()}
                  >
                    {courses.map((course) => (
                      <Option key={course.id} value={course.id}>
                        {course.title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Card>
          ) : (
            /* 关联信息显示区域 - 编辑模式下显示，普通用户只读 */
            currentExercise && (
              <Card
                size="small"
                className="mb-6"
                style={{ backgroundColor: "#f0f8ff" }}
              >
                <div className="mb-3">
                  <h4 className="text-base font-medium text-gray-900 flex items-center">
                    <span className="text-blue-500 mr-2">📎</span>
                    关联信息
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      （关联信息创建后不可修改）
                    </span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">
                        年级：
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {currentExercise.grade?.name || "数据加载中..."}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">
                        学科：
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {currentExercise.subjectInfo?.name || "数据加载中..."}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">
                        单元：
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {currentExercise.unit?.title || "数据加载中..."}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">
                        课程：
                      </span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {currentExercise.course?.title || "数据加载中..."}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          )}

          {/* 基本信息 */}
          <Card size="small" className="mb-4">
            <h4 className="text-base font-medium text-gray-900 mb-4">
              基本信息
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="title"
                label="习题标题"
                rules={[{ required: true, message: "请输入习题标题" }]}
              >
                <Input placeholder="输入习题标题" />
              </Form.Item>

              <Form.Item
                name="type"
                label="题目类型"
                rules={[{ required: true, message: "请选择题目类型" }]}
              >
                <Select placeholder="选择题目类型">
                  {questionTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="difficulty"
                label="难度等级"
                rules={[{ required: true, message: "请选择难度等级" }]}
              >
                <Select placeholder="选择难度等级">
                  {difficultyOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="keywords" label="关键词">
                <Input placeholder="输入关键词，用逗号分隔" />
              </Form.Item>
            </div>

            {/* 状态选择字段 - 只有管理员和超级管理员在编辑模式下可见 */}
            {canModifyStatus() && currentExercise && (
              <Form.Item
                name="status"
                label="发布状态"
                rules={[{ required: true, message: "请选择发布状态" }]}
              >
                <Select placeholder="选择发布状态">
                  {getStatusOptions().map((status) => (
                    <Option key={status.value} value={status.value}>
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          getStatusColor(status.value) === "green"
                            ? "bg-green-500"
                            : getStatusColor(status.value) === "orange"
                            ? "bg-orange-500"
                            : getStatusColor(status.value) === "blue"
                            ? "bg-blue-500"
                            : getStatusColor(status.value) === "red"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      />
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Card>

          {/* 题目内容 */}
          <Card size="small" className="mb-4">
            <h4 className="text-base font-medium text-gray-900 mb-4">
              题目内容
            </h4>

            <Form.Item
              name="question"
              label="题目描述"
              rules={[{ required: true, message: "请输入题目描述" }]}
            >
              <ReactQuill
                readOnly={!canEdit()}
                theme="snow"
                placeholder="输入题目描述..."
                style={{ height: "200px", marginBottom: "50px" }}
              />
            </Form.Item>

            <Form.Item name="explanation" label="解题说明">
              <ReactQuill
                readOnly={!canEdit()}
                theme="snow"
                placeholder="输入解题说明..."
                style={{ height: "150px", marginBottom: "50px" }}
              />
            </Form.Item>
          </Card>

          {/* 选择题选项 */}
          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const questionType = getFieldValue("type");
              if (questionType === "choice") {
                return (
                  <Card size="small" className="mb-4">
                    <h4 className="text-base font-medium text-gray-900 mb-4">
                      选择题选项
                    </h4>

                    <Form.List name="options">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2 mb-2"
                            >
                              <Form.Item
                                {...restField}
                                name={[name]}
                                rules={[
                                  { required: true, message: "请输入选项内容" },
                                ]}
                                className="flex-1 mb-0"
                              >
                                <Input
                                  placeholder={`选项 ${String.fromCharCode(
                                    65 + name
                                  )}`}
                                />
                              </Form.Item>
                              <Button
                                type="text"
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                                danger
                              />
                            </div>
                          ))}
                          <Form.Item>
                            <Button
                              type="dashed"
                              onClick={() => add()}
                              block
                              icon={<PlusOutlined />}
                            >
                              添加选项
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>

                    <Form.Item
                      name="correctAnswer"
                      label="正确答案"
                      rules={[{ required: true, message: "请输入正确答案" }]}
                    >
                      <Input placeholder="输入正确答案（如：A、B、C等）" />
                    </Form.Item>
                  </Card>
                );
              }
              return null;
            }}
          </Form.Item>

          {/* 填空题答案 */}
          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const questionType = getFieldValue("type");
              if (questionType === "fill_blank") {
                return (
                  <Card size="small" className="mb-4">
                    <h4 className="text-base font-medium text-gray-900 mb-4">
                      填空题答案
                    </h4>

                    <Form.Item
                      name="correctAnswer"
                      label="标准答案"
                      rules={[{ required: true, message: "请输入标准答案" }]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="输入标准答案，多个答案用分号分隔"
                      />
                    </Form.Item>
                  </Card>
                );
              }
              return null;
            }}
          </Form.Item>

          {/* 知识点关联 */}
          <Card size="small" className="mb-4">
            <h4 className="text-base font-medium text-gray-900 mb-4">
              知识点关联
            </h4>

            <Transfer
              dataSource={knowledgePointsData}
              titles={["可选知识点", "已选知识点"]}
              targetKeys={selectedKnowledgePointKeys}
              onChange={(targetKeys) =>
                setSelectedKnowledgePointKeys(targetKeys as string[])
              }
              render={(item) => item.title}
              showSearch
              listStyle={{
                width: 250,
                height: 300,
              }}
            />
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button onClick={() => navigate("/exercises")}>取消</Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={submitting || !canEdit()}
            >
              保存
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={saving || !canSubmit()}
            >
              {isEditMode ? "提交审核" : "创建并提交审核"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ExerciseForm;
