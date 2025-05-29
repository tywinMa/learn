import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Select, Radio, Space, Divider, message, Spin, Typography, Row, Col, Transfer } from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./ExerciseForm.css";
import { getExerciseById, createExercise, updateExercise } from "../../services/exerciseService";
import { getCourses } from "../../services/courseService";
import { getKnowledgePointsForSelect } from "../../services/knowledgePointService";
import { getSubjects } from "../../services/subjectService";

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
  subject: string;
  title: string;
  type: "choice" | "fill_blank" | "application" | "matching";
  difficulty: number;
  question: string;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
  knowledgePointIds?: string[];
}

interface TransferKnowledgePoint {
  key: string;
  title: string;
  description: string;
}

const ExerciseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  // Transfer组件相关状态
  const [knowledgePointsData, setKnowledgePointsData] = useState<TransferKnowledgePoint[]>([]);
  const [selectedKnowledgePointKeys, setSelectedKnowledgePointKeys] = useState<string[]>([]);

  // 初始化表单
  const initialValues: FormValues = {
    subject: "math",
    title: "",
    type: "choice",
    difficulty: 2,
    question: "",
    options: [
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ],
    correctAnswer: null,
    explanation: "",
    knowledgePointIds: [],
  };

  // 获取课程列表和知识点列表
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectsData = await getSubjects();
        console.log("从API获取的学科数据:", subjectsData);
        const formattedSubjects = subjectsData.map((subject) => ({
          value: subject.code,
          label: subject.name,
        }));
        console.log("格式化后的学科选项:", formattedSubjects);
        setSubjects(formattedSubjects);
      } catch (error) {
        console.error("获取学科列表失败:", error);
      }
    };

    const fetchCourses = async () => {
      try {
        const coursesData = await getCourses();
        setCourses(coursesData); // 直接使用返回的数组
      } catch (error) {
        console.error("获取课程列表失败:", error);
      }
    };

    const fetchKnowledgePoints = async () => {
      try {
        // 初始化时加载默认学科（math）的知识点
        const defaultSubject = "math";
        const kpData = await getKnowledgePointsForSelect(defaultSubject);
        setKnowledgePoints(kpData);
        setSelectedSubject(defaultSubject);
        
        // 转换为Transfer组件需要的格式
        const transferData = kpData.map((kp: any) => ({
          key: kp.id.toString(),
          title: kp.title,
          description: `学科: ${kp.subject}`,
        }));
        setKnowledgePointsData(transferData);
      } catch (error) {
        console.error("获取知识点列表失败:", error);
      }
    };

    fetchSubjects();
    fetchCourses();
    fetchKnowledgePoints();
  }, []);

  // 学科变化时过滤课程和知识点
  const handleSubjectChange = async (subject: string) => {
    setSelectedSubject(subject);
    form.setFieldValue("knowledgePointIds", []); // 清空知识点选择
    setSelectedKnowledgePointKeys([]); // 清空Transfer选择

    // 重新获取该学科的知识点
    try {
      const kpData = await getKnowledgePointsForSelect(subject);
      setKnowledgePoints(kpData);
      
      // 转换为Transfer组件需要的格式
      const transferData = kpData.map((kp: any) => ({
        key: kp.id.toString(),
        title: kp.title,
        description: `学科: ${kp.subject}`,
      }));
      setKnowledgePointsData(transferData);
    } catch (error) {
      console.error("获取知识点列表失败:", error);
    }
  };

  // Transfer组件变化处理
  const handleKnowledgePointTransferChange = (targetKeys: React.Key[]) => {
    const keys = targetKeys.map(key => key.toString());
    setSelectedKnowledgePointKeys(keys);
    // 同步更新表单数据
    form.setFieldValue("knowledgePointIds", keys);
  };

  // 获取当前学科的课程
  const filteredCourses = selectedSubject
    ? courses.filter((course) => course.subjectName === selectedSubject)
    : courses;

  // 处理题型变更
  const handleTypeChange = (type: string) => {
    let options;
    let correctAnswer = null;

    switch (type) {
      case "choice":
        options = [
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ];
        break;
      case "matching":
        options = {
          left: ["", "", "", ""],
          right: ["", "", "", ""],
        };
        correctAnswer = [0, 1, 2, 3];
        break;
      case "fill_blank":
        options = null;
        correctAnswer = [""];
        break;
      case "application":
        options = {
          allowPhoto: true,
          hint: "请解答并上传图片",
        };
        correctAnswer = "";
        break;
    }

    form.setFieldsValue({
      options,
      correctAnswer,
    });
  };

  // 处理选项的正确性切换（选择题 - 支持多选）
  const toggleOptionCorrect = (optionIndex: number) => {
    const options = form.getFieldValue("options") || [];
    const newOptions = [...options];

    // 切换当前选项的正确性
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      isCorrect: !newOptions[optionIndex].isCorrect,
    };

    form.setFieldsValue({ options: newOptions });
  };

  // 加载编辑数据
  useEffect(() => {
    if (isEditMode && id) {
      const fetchExerciseData = async () => {
        setLoading(true);
        try {
          const exerciseData = await getExerciseById(id);
          if (exerciseData) {
            // 处理选项数据格式转换
            let processedOptions: any = exerciseData.options;
            if (exerciseData.type === "choice" && Array.isArray(exerciseData.options)) {
              // 将字符串数组转换为对象数组格式
              processedOptions = exerciseData.options.map((optionText: string) => ({
                content: optionText,
                isCorrect: false, // 初始化为false，后续根据correctAnswer设置
              }));

              // 根据correctAnswer设置正确答案
              if (Array.isArray(exerciseData.correctAnswer)) {
                exerciseData.correctAnswer.forEach((correctOption: any) => {
                  const correctIndex = exerciseData.options.findIndex(
                    (option: string) => option === String(correctOption)
                  );
                  if (correctIndex >= 0 && processedOptions[correctIndex]) {
                    processedOptions[correctIndex].isCorrect = true;
                  }
                });
              } else if (typeof exerciseData.correctAnswer === "number") {
                // 如果correctAnswer是数字索引
                if (processedOptions[exerciseData.correctAnswer]) {
                  processedOptions[exerciseData.correctAnswer].isCorrect = true;
                }
              }
            }

            // 设置表单数据
            form.setFieldsValue({
              subject: exerciseData.subject,
              title: exerciseData.title || "",
              type: exerciseData.type,
              difficulty: exerciseData.difficulty,
              question: exerciseData.question,
              options: processedOptions,
              correctAnswer: exerciseData.correctAnswer,
              explanation: exerciseData.explanation,
              knowledgePointIds: exerciseData.knowledgePointIds || [],
            });
            setSelectedSubject(exerciseData.subject);

            // 加载该学科的知识点
            try {
              const kpData = await getKnowledgePointsForSelect(exerciseData.subject);
              setKnowledgePoints(kpData);
              
              // 转换为Transfer组件需要的格式
              const transferData = kpData.map((kp: any) => ({
                key: kp.id.toString(),
                title: kp.title,
                description: `学科: ${kp.subject}`,
              }));
              setKnowledgePointsData(transferData);
              
              // 设置已选择的知识点
              const selectedKeys = (exerciseData.knowledgePointIds || []).map((id: any) => id.toString());
              setSelectedKnowledgePointKeys(selectedKeys);
            } catch (error) {
              console.error("获取知识点列表失败:", error);
            }
          } else {
            message.error("未找到习题信息");
            navigate("/exercises");
          }
        } catch (error) {
          console.error("加载习题数据失败:", error);
          message.error("加载习题数据失败");
          navigate("/exercises");
        } finally {
          setLoading(false);
        }
      };

      fetchExerciseData();
    } else if (!isEditMode) {
      // 新建模式下，检查是否有AI生成的数据
      const checkAiGeneratedData = () => {
        const aiDataStr = sessionStorage.getItem("aiGeneratedExercise");
        if (aiDataStr) {
          try {
            const aiData = JSON.parse(aiDataStr);
            console.log("加载AI生成的数据:", aiData);

            // 处理AI生成的选项数据格式
            let processedOptions: any = aiData.options;
            if (aiData.type === "choice" && Array.isArray(aiData.options)) {
              processedOptions = aiData.options.map((option: any, index: number) => ({
                content: option.text || option.content || String(option),
                isCorrect: index === aiData.correctAnswer || option.isCorrect === true,
              }));
            }

            // 设置表单数据
            form.setFieldsValue({
              subject: aiData.subject,
              title: aiData.title || "",
              type: aiData.type || "choice",
              difficulty: aiData.difficulty || 2,
              question: aiData.question || "",
              options: processedOptions,
              correctAnswer: aiData.correctAnswer,
              explanation: aiData.explanation || "",
              knowledgePointIds: aiData.knowledgePointIds || [],
            });

            // 设置学科并加载对应的知识点
            setSelectedSubject(aiData.subject);
            if (aiData.subject) {
              const loadKnowledgePoints = async () => {
                try {
                  const kpData = await getKnowledgePointsForSelect(aiData.subject);
                  setKnowledgePoints(kpData);
                  
                  // 转换为Transfer组件需要的格式
                  const transferData = kpData.map((kp: any) => ({
                    key: kp.id.toString(),
                    title: kp.title,
                    description: `学科: ${kp.subject}`,
                  }));
                  setKnowledgePointsData(transferData);
                  
                  // 设置已选择的知识点
                  const selectedKeys = (aiData.knowledgePointIds || []).map((id: any) => id.toString());
                  setSelectedKnowledgePointKeys(selectedKeys);
                } catch (error) {
                  console.error("获取知识点列表失败:", error);
                }
              };
              loadKnowledgePoints();
            }

            // 清除sessionStorage中的数据，避免重复使用
            sessionStorage.removeItem("aiGeneratedExercise");

            message.success("AI生成的习题数据已自动填充，请检查并完善信息");
          } catch (error) {
            console.error("解析AI生成数据失败:", error);
            sessionStorage.removeItem("aiGeneratedExercise");
          }
        }
      };

      checkAiGeneratedData();
    }
  }, [id, isEditMode, form, navigate]);

  // 提交表单
  const handleSubmit = async (values: FormValues) => {
    try {
      setSaving(true);
      console.log("开始提交表单，表单数据:", values);

      // 验证选择题是否设置了正确答案
      if (values.type === "choice") {
        const hasCorrectAnswer =
          Array.isArray(values.options) && values.options.some((option: any) => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          message.error("选择题必须至少设置一个正确答案");
          return;
        }
      }

      // 构建练习题数据
      const exerciseData: any = {
        subject: values.subject,
        title: values.title,
        question: values.question,
        type: values.type,
        difficulty: values.difficulty,
        explanation: values.explanation || "",
        options: values.options,
        correctAnswer: values.correctAnswer,
        knowledgePointIds: values.knowledgePointIds || [],
      };

      // 如果是选择题，从options中提取正确答案
      if (values.type === "choice" && Array.isArray(values.options)) {
        const correctIndexes = values.options
          .map((option: any, index: number) => (option.isCorrect === true ? index : -1))
          .filter((index: number) => index !== -1);
        exerciseData.correctAnswer = correctIndexes.length === 1 ? correctIndexes[0] : correctIndexes;
      }

      console.log("准备发送的习题数据:", exerciseData);

      if (isEditMode && id) {
        // 更新习题
        console.log("执行更新操作，ID:", id);
        const result = await updateExercise(id, exerciseData);
        console.log("更新结果:", result);
        if (result) {
          message.success("习题更新成功");
          navigate("/exercises");
        } else {
          message.error("习题更新失败");
        }
      } else {
        // 创建习题
        console.log("执行创建操作");
        const result = await createExercise(exerciseData);
        console.log("创建结果:", result);
        if (result) {
          message.success("习题创建成功");
          navigate("/exercises");
        } else {
          message.error("习题创建失败");
        }
      }
    } catch (error) {
      console.error("提交表单失败，错误详情:", error);
      message.error("提交表单失败: " + (error instanceof Error ? error.message : "未知错误"));
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/exercises")} className="mr-3" />
          {isEditMode ? "编辑习题" : "创建习题"}
        </Title>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>
        <Card className="mb-4">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="subject" label="学科" rules={[{ required: true, message: "请选择学科" }]}>
                <Select onChange={(value: string) => handleSubjectChange(value)}>
                  {subjects.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="difficulty" label="难度级别" rules={[{ required: true, message: "请选择难度级别" }]}>
                <Radio.Group>
                  {difficultyOptions.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="title" label="习题标题" rules={[{ required: true, message: "请输入习题标题" }]}>
                <Input placeholder="输入习题标题" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="type" label="题目类型" rules={[{ required: true, message: "请选择题目类型" }]}>
            <Select onChange={(value: string) => handleTypeChange(value)}>
              {questionTypes.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="relative mb-4">
            <Divider orientation="left">题目内容</Divider>
            <Form.Item
              name="question"
              rules={[{ required: true, message: "请输入题目内容" }]}
              style={{ marginBottom: 0 }}
            >
              <ReactQuill theme="snow" style={{ height: 150, marginBottom: 40 }} />
            </Form.Item>
          </div>

          <Form.Item name="knowledgePointIds" label="关联知识点" extra="选择与此题目相关的知识点">
            <Transfer
              dataSource={knowledgePointsData}
              titles={['可选知识点', '已选知识点']}
              targetKeys={selectedKnowledgePointKeys}
              onChange={handleKnowledgePointTransferChange}
              render={item => item.title}
              showSearch
              filterOption={(inputValue, option) =>
                option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.description.toLowerCase().includes(inputValue.toLowerCase())
              }
              listStyle={{
                width: 280,
                height: 300,
              }}
              oneWay={false}
            />
          </Form.Item>

          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue("type");

              switch (type) {
                case "choice":
                  return (
                    <>
                      <Divider orientation="left">选项设置</Divider>
                      <Form.List name="options">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map((field, index) => (
                              <div key={field.key} className="flex items-start space-x-2 mb-2">
                                <Form.Item
                                  name={[field.name, "content"]}
                                  rules={[{ required: true, message: "请输入选项内容" }]}
                                  style={{ flexGrow: 1, marginBottom: 8 }}
                                >
                                  <Input placeholder={`选项 ${index + 1}`} />
                                </Form.Item>

                                <Button
                                  type={
                                    form.getFieldValue(["options", index, "isCorrect"]) === true ? "primary" : "default"
                                  }
                                  onClick={() => toggleOptionCorrect(index)}
                                  icon={<CheckCircleOutlined />}
                                >
                                  {form.getFieldValue(["options", index, "isCorrect"]) === true
                                    ? "正确答案"
                                    : "设为正确"}
                                </Button>

                                {fields.length > 2 && (
                                  <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                                )}
                              </div>
                            ))}

                            <Button
                              type="dashed"
                              onClick={() => add({ content: "", isCorrect: false })}
                              icon={<PlusOutlined />}
                              className="w-full mt-2"
                            >
                              添加选项
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </>
                  );

                case "fill_blank":
                  return (
                    <>
                      <Divider orientation="left">填空题答案</Divider>
                      <Form.Item
                        name="correctAnswer"
                        label="正确答案"
                        rules={[{ required: true, message: "请输入正确答案" }]}
                        extra="如有多个可接受的答案，请用英文逗号分隔"
                      >
                        <TextArea rows={2} placeholder="例如: 4,四,Four" />
                      </Form.Item>
                    </>
                  );

                case "application":
                  return (
                    <>
                      <Divider orientation="left">应用题设置</Divider>
                      <Form.Item name={["options", "hint"]} label="提示信息">
                        <Input placeholder="给学生的提示信息" />
                      </Form.Item>

                      <Form.Item name="correctAnswer" label="参考答案">
                        <TextArea rows={4} placeholder="请输入参考答案" />
                      </Form.Item>
                    </>
                  );

                case "matching":
                  return (
                    <>
                      <Divider orientation="left">匹配项设置</Divider>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.List name={["options", "left"]}>
                            {(fields, { add, remove }) => (
                              <div className="mb-4">
                                <div className="mb-2 font-bold">左侧项目</div>
                                {fields.map((field, index) => (
                                  <div key={field.key} className="flex items-center space-x-2 mb-2">
                                    <Form.Item
                                      name={field.name}
                                      rules={[{ required: true, message: "请输入左侧项内容" }]}
                                      style={{ flexGrow: 1, marginBottom: 0 }}
                                    >
                                      <Input placeholder={`左侧项 ${index + 1}`} />
                                    </Form.Item>

                                    {fields.length > 2 && (
                                      <Button
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => remove(field.name)}
                                      />
                                    )}
                                  </div>
                                ))}

                                <Button
                                  type="dashed"
                                  onClick={() => add()}
                                  icon={<PlusOutlined />}
                                  className="w-full mt-2"
                                >
                                  添加左侧项
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </Col>

                        <Col span={12}>
                          <Form.List name={["options", "right"]}>
                            {(fields, { add, remove }) => (
                              <div className="mb-4">
                                <div className="mb-2 font-bold">右侧项目</div>
                                {fields.map((field, index) => (
                                  <div key={field.key} className="flex items-center space-x-2 mb-2">
                                    <Form.Item
                                      name={field.name}
                                      rules={[{ required: true, message: "请输入右侧项内容" }]}
                                      style={{ flexGrow: 1, marginBottom: 0 }}
                                    >
                                      <Input placeholder={`右侧项 ${index + 1}`} />
                                    </Form.Item>

                                    {fields.length > 2 && (
                                      <Button
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => remove(field.name)}
                                      />
                                    )}
                                  </div>
                                ))}

                                <Button
                                  type="dashed"
                                  onClick={() => add()}
                                  icon={<PlusOutlined />}
                                  className="w-full mt-2"
                                >
                                  添加右侧项
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </Col>
                      </Row>
                    </>
                  );

                default:
                  return null;
              }
            }}
          </Form.Item>

          <Divider orientation="left">解释说明</Divider>
          <Form.Item name="explanation" label="题目解释" extra="可选，用于解释答案或提供额外说明">
            <TextArea rows={4} placeholder="请输入题目解释" />
          </Form.Item>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button onClick={() => navigate("/exercises")}>取消</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {isEditMode ? "更新习题" : "创建习题"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ExerciseForm;
