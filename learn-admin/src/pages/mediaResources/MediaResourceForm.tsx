import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  message,
  InputNumber,
  Card,
  Divider,
  Space,
} from "antd";
import {
  UploadOutlined,
  LoadingOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  type MediaResource,
  type CreateMediaResourceData,
  mediaResourceService,
  courseMediaResourceService,
} from "../../services/mediaResourceService";
import { uploadImage, uploadVideo } from "../../services/uploadService";
import { getSubjects, type Subject } from "../../services/subjectService";
import { getGrades, type Grade } from "../../services/gradeService";
import { getCourses, type Course } from "../../services/courseService";
import { getAllUnits, type Unit } from "../../services/unitService";
import { useUser } from "../../contexts/UserContext";

// 根据课程ID查找单元的辅助函数
const findUnitByCourseId = (courseId: string, units: Unit[]): Unit | null => {
  return units.find(unit => 
    unit.courseIds && unit.courseIds.includes(courseId)
  ) || null;
};

const { Option } = Select;

interface MediaResourceFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  resource?: MediaResource | null;
}

const MediaResourceForm: React.FC<MediaResourceFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  resource,
}) => {
  const [form] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [thumbnailFileList, setThumbnailFileList] = useState<any[]>([]);
  const { user } = useUser();

  // 媒体资源管理状态
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // 资源类型选项
  const resourceTypes = [
    { value: "course_explanation", label: "课程讲解资源" },
    { value: "course_media", label: "课程媒体资源" },
    { value: "example_media", label: "例题媒体资源" },
  ];

  // 文件类型选项
  const fileTypeOptions = [
    { value: "image", label: "图片" },
    { value: "video", label: "视频" },
  ];

  // 状态选项（只有管理员和超级管理员可见）
  const statusOptions = [
    { value: "draft", label: "草稿", color: "gray" },
    { value: "pending", label: "待审核", color: "orange" },
    { value: "published", label: "已发布", color: "green" },
    { value: "under_review", label: "审核中", color: "blue" },
    { value: "rejected", label: "已退回", color: "red" },
  ];

  // 状态显示标签
  const getStatusLabel = (status: string) => {
    const statusMap = {
      draft: "草稿",
      pending: "待审核",
      published: "已发布",
      under_review: "审核中",
      rejected: "已退回",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 判断是否可以编辑
  const isEditable = () => {
    if (!resource) return true; // 新增模式总是可编辑

    // 管理员和超级管理员可以编辑任何状态的媒体资源
    if (user?.role === "admin" || user?.role === "superadmin") {
      return true;
    }

    // 普通用户只能编辑草稿和已退回状态的资源
    return ["draft", "rejected"].includes(resource.status);
  };

  // 判断是否可以提交审核
  const canSubmit = () => {
    if (!resource) return true; // 新增模式可以提交

    // 管理员和超级管理员可以提交任何状态的媒体资源
    if (user?.role === "admin" || user?.role === "superadmin") {
      return true;
    }

    // 普通用户只能提交草稿和已退回状态的资源
    return ["draft", "rejected"].includes(resource.status);
  };

  // 判断是否有权限修改状态（只有管理员和系统管理员可以）
  const canModifyStatus = () => {
    return user?.role === "admin" || user?.role === "superadmin";
  };

  // 加载基础数据
  useEffect(() => {
    if (visible) {
      loadGrades();
      loadSubjects();
    }
  }, [visible]);

  // 加载年级数据
  const loadGrades = async () => {
    try {
      const gradesData = await getGrades();
      setGrades(gradesData);
    } catch (error) {
      console.error("加载年级数据失败:", error);
    }
  };

  // 加载学科数据
  const loadSubjects = async () => {
    try {
      const subjectsData = await getSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error("加载学科数据失败:", error);
    }
  };

  // 加载所有单元数据（用于编辑模式下显示关联信息）
  const loadAllUnitsForDisplay = async () => {
    try {
      const allUnits = await getAllUnits();
      setUnits(allUnits);
    } catch (error) {
      console.error("加载单元数据失败:", error);
    }
  };

  // 加载单元数据
  const loadUnits = async (gradeId: string, subjectCode: string) => {
    try {
      // 获取所有单元，然后前端筛选
      const allUnits = await getAllUnits();

      // 根据年级ID和学科代码筛选单元
      const filteredUnits = allUnits.filter((unit) => {
        // 检查单元的subjectGrade是否匹配选择的年级和学科
        if (unit.subjectGrade) {
          return (
            unit.subjectGrade.gradeId === parseInt(gradeId) &&
            unit.subjectGrade.subjectCode === subjectCode
          );
        }
        return false;
      });

      console.log(
        `筛选单元: 年级${gradeId}, 学科${subjectCode}, 结果:`,
        filteredUnits
      );
      setUnits(filteredUnits);
      return filteredUnits; // 返回筛选后的单元数据
    } catch (error) {
      console.error("加载单元数据失败:", error);
      message.error("加载单元数据失败");
      return []; // 出错时返回空数组
    }
  };

  // 加载课程数据
  const loadCourses = async (gradeId: string, subjectCode: string) => {
    try {
      // 获取所有课程，然后前端筛选
      const allCourses = await getCourses();

      console.log("=== 课程筛选调试信息 ===");
      console.log("筛选条件 - 年级ID:", gradeId, "类型:", typeof gradeId);
      console.log("筛选条件 - 学科代码:", subjectCode, "类型:", typeof subjectCode);
      console.log("所有课程数据:", allCourses);
      console.log("前3个课程的gradeId和subject字段:", allCourses.slice(0, 3).map(course => ({
        id: course.id,
        title: course.title,
        gradeId: course.gradeId,
        gradeIdType: typeof course.gradeId,
        subject: course.subject,
        subjectType: typeof course.subject
      })));

      // 根据年级ID和学科代码筛选课程
      const filteredCourses = allCourses.filter((course) => {
        const gradeMatch = course.gradeId === parseInt(gradeId);
        const subjectMatch = course.subject === subjectCode;
        
        console.log(`课程 ${course.title}: gradeId(${course.gradeId}) === parseInt(${gradeId})(${parseInt(gradeId)}) = ${gradeMatch}, subject(${course.subject}) === ${subjectCode} = ${subjectMatch}`);
        
        return gradeMatch && subjectMatch;
      });

      console.log(
        `筛选课程: 年级${gradeId}, 学科${subjectCode}, 结果:`,
        filteredCourses
      );
      console.log("=== 课程筛选调试信息结束 ===");
      setCourses(filteredCourses);
    } catch (error) {
      console.error("加载课程数据失败:", error);
      message.error("加载课程数据失败");
    }
  };

  // 根据单元加载课程数据
  const loadCoursesByUnit = async (unitId: string) => {
    try {
      // 找到选中的单元
      const selectedUnitObj = units.find(unit => unit.id === unitId);
      if (!selectedUnitObj || !selectedUnitObj.courseIds || selectedUnitObj.courseIds.length === 0) {
        console.log("未找到单元或单元没有课程关联:", unitId);
        setCourses([]);
        return;
      }

      console.log("=== 根据单元筛选课程调试信息 ===");
      console.log("选中的单元:", selectedUnitObj);
      console.log("单元包含的课程ID:", selectedUnitObj.courseIds);

      // 获取所有课程
      const allCourses = await getCourses();

      // 根据单元的courseIds筛选课程
      const filteredCourses = allCourses.filter(course => 
        selectedUnitObj.courseIds?.includes(course.id)
      );

      console.log(`根据单元${unitId}筛选课程结果:`, filteredCourses);
      console.log("=== 根据单元筛选课程调试信息结束 ===");
      setCourses(filteredCourses);
    } catch (error) {
      console.error("根据单元加载课程数据失败:", error);
      message.error("根据单元加载课程数据失败");
    }
  };

  // 年级选择处理
  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId.toString()); // 转换为字符串用于后续API调用
    setSelectedSubject("");
    setSelectedUnit("");
    setSelectedCourse("");
    setUnits([]);
    setCourses([]);
    form.setFieldsValue({
      subject: undefined,
      unit: undefined,
      course: undefined,
    });
  };

  // 学科选择处理
  const handleSubjectChange = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setSelectedUnit("");
    setSelectedCourse("");
    setCourses([]);
    form.setFieldsValue({ unit: undefined, course: undefined });

    if (selectedGrade && subjectCode) {
      loadUnits(selectedGrade, subjectCode);
    }
  };

  // 单元选择处理
  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedCourse("");
    form.setFieldsValue({ course: undefined });

    // 选择单元后，根据单元的courseIds来加载课程
    if (unitId) {
      loadCoursesByUnit(unitId);
    }
  };

  // 课程选择处理
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  useEffect(() => {
    if (visible) {
      // 总是加载年级和学科数据
      loadGrades();
      loadSubjects();
      
      // 在编辑模式下也需要加载所有单元数据，用于显示关联信息
      if (resource) {
        loadAllUnitsForDisplay();
      }

      if (resource) {
        // 编辑模式
        form.setFieldsValue({
          type: resource.type,
          resourceType: resource.resourceType,
          title: resource.title,
          description: resource.description,
          resourceUrl: resource.resourceUrl,
          fileSize: resource.fileSize,
          duration: resource.duration,
          thumbnailUrl: resource.thumbnailUrl,
          tags: resource.tags?.join(", ") || "",
          status: resource.status, // 设置状态值
        });

        // 设置文件列表
        if (resource.resourceUrl) {
          setFileList([
            {
              uid: "-1",
              name: resource.title,
              status: "done",
              url: resource.resourceUrl,
            },
          ]);
        }

        if (resource.thumbnailUrl) {
          setThumbnailFileList([
            {
              uid: "-1",
              name: "缩略图",
              status: "done",
              url: resource.thumbnailUrl,
            },
          ]);
        }

        // 设置关联的课程信息
        if (resource.courses && resource.courses.length > 0) {
          const firstCourse = resource.courses[0];
          if (firstCourse.grade && firstCourse.grade.id) {
            const gradeId = firstCourse.grade.id; // 保持number类型
            setSelectedGrade(gradeId.toString()); // setSelectedGrade需要字符串用于后续逻辑
            form.setFieldsValue({ grade: gradeId }); // 表单值使用number类型匹配Option
          }
          if (firstCourse.subjectInfo && firstCourse.subjectInfo.code) {
            setSelectedSubject(firstCourse.subjectInfo.code);
            form.setFieldsValue({ subject: firstCourse.subjectInfo.code });
          }

          // 先加载单元和课程数据，然后再设置选中的单元和课程
          if (firstCourse.grade && firstCourse.subjectInfo) {
            const gradeId = firstCourse.grade.id.toString(); // 这里仍需要字符串用于API调用
            const subjectCode = firstCourse.subjectInfo.code;
            const courseId = firstCourse.id;

            // 异步加载数据并设置选中值
            const loadAndSetCourseData = async () => {
              try {
                // 加载单元数据并获取返回值
                const loadedUnits = await loadUnits(gradeId, subjectCode);

                // 加载课程数据
                await loadCourses(gradeId, subjectCode);

                // 从加载的单元中找到包含当前课程的单元
                let targetUnit = null;
                for (const unit of loadedUnits) {
                  if (unit.courseIds && unit.courseIds.includes(courseId)) {
                    targetUnit = unit;
                    break;
                  }
                }

                if (targetUnit) {
                  setSelectedUnit(targetUnit.id);
                  form.setFieldsValue({ unit: targetUnit.id });
                }

                // 设置课程
                setSelectedCourse(courseId);
                form.setFieldsValue({ course: courseId });
              } catch (error) {
                console.error("加载课程关联数据失败:", error);
              }
            };

            loadAndSetCourseData();
          }
        }
      } else {
        // 新增模式
        form.resetFields();
        setFileList([]);
        setThumbnailFileList([]);
        setSelectedGrade("");
        setSelectedSubject("");
        setSelectedUnit("");
        setSelectedCourse("");
        setUnits([]);
        setCourses([]);
      }
    }
  }, [visible, resource, form]);

  // 保存为草稿
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      // 处理标签
      const tags = values.tags
        ? values.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];

      const data: any = {
        type: values.type,
        resourceType: values.resourceType,
        title: values.title,
        description: values.description,
        resourceUrl: values.resourceUrl,
        fileSize: values.fileSize,
        duration: values.duration,
        thumbnailUrl: values.thumbnailUrl,
        tags,
      };

      // 如果是编辑模式且用户有权限修改状态，则包含status字段
      if (resource && canModifyStatus()) {
        data.status = values.status;
      }

      if (resource) {
        // 编辑保存
        await mediaResourceService.updateMediaResource(resource.id, data);

        // 编辑模式下不更新课程关联（关联信息创建后不可修改）

        message.success("媒体资源保存成功");
      } else {
        // 新增保存为草稿
        const createdResource = await mediaResourceService.createMediaResource(
          data
        );

        // 如果有课程关联，创建关联关系
        if (selectedCourse) {
          try {
            await courseMediaResourceService.createCourseMediaResource({
              courseId: selectedCourse,
              mediaResourceId: (createdResource as any).id,
              displayOrder: 0,
              isActive: true,
            });
          } catch (error) {
            console.error("关联课程失败:", error);
            message.warning("媒体资源创建成功，但关联到课程失败");
          }
        }

        message.success("媒体资源已保存为草稿");
      }

      onSubmit();
    } catch (error) {
      console.error("保存失败:", error);
      message.error("保存失败，请检查表单信息");
    } finally {
      setSaveLoading(false);
    }
  };

  // 提交审核
  const handleSubmitForReview = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      // 验证课程关联是否完整（仅在新增模式下验证）
      if (!resource) {
        if (!selectedCourse) {
          message.error("请完成课程关联设置，选择年级、学科、单元和课程");
          setSubmitLoading(false);
          return;
        }
      }

      // 处理标签
      const tags = values.tags
        ? values.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];

      const data: any = {
        type: values.type,
        resourceType: values.resourceType,
        title: values.title,
        description: values.description,
        resourceUrl: values.resourceUrl,
        fileSize: values.fileSize,
        duration: values.duration,
        thumbnailUrl: values.thumbnailUrl,
        tags,
      };

      // 如果是编辑模式且用户有权限修改状态，则包含status字段
      if (resource && canModifyStatus()) {
        data.status = values.status;
      }

      let mediaResourceId: number;

      if (resource) {
        // 编辑模式：先更新，再提交审核
        await mediaResourceService.updateMediaResource(resource.id, data);

        // 编辑模式下不更新课程关联（关联信息创建后不可修改）

        await mediaResourceService.submitForReview(resource.id);
        message.success("媒体资源已提交审核");
      } else {
        // 新增模式：创建并提交审核
        const createdResource = await mediaResourceService.createMediaResource(
          data
        );
        mediaResourceId = (createdResource as any).id;

        // 创建课程关联
        try {
          await courseMediaResourceService.createCourseMediaResource({
            courseId: selectedCourse,
            mediaResourceId: mediaResourceId,
            displayOrder: 0,
            isActive: true,
          });
        } catch (error) {
          console.error("关联课程失败:", error);
          message.warning("媒体资源创建成功，但关联到课程失败");
        }

        // 提交审核
        await mediaResourceService.submitForReview(mediaResourceId);
        message.success("媒体资源已创建并提交审核");
      }

      onSubmit();
    } catch (error) {
      console.error("提交失败:", error);
      message.error("提交失败，请检查表单信息");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 获取视频时长的辅助函数
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error("获取视频时长失败"));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      let fileUrl: string | null = null;

      // 根据文件类型选择上传函数
      if (file.type.startsWith("image/")) {
        fileUrl = await uploadImage(file);
      } else if (file.type.startsWith("video/")) {
        fileUrl = await uploadVideo(file);
      } else {
        message.error("不支持的文件类型");
        return;
      }

      if (!fileUrl) {
        console.log("fileUrl", fileUrl);
        message.error("文件上传失败");
        return;
      }

      // 更新表单字段
      form.setFieldsValue({ resourceUrl: fileUrl });

      // 如果是图片，自动设置为image类型
      if (file.type.startsWith("image/")) {
        form.setFieldsValue({ resourceType: "image" });
      } else if (file.type.startsWith("video/")) {
        form.setFieldsValue({ resourceType: "video" });

        // 自动设置文件大小
        form.setFieldsValue({ fileSize: file.size });

        // 自动获取和设置视频时长
        try {
          const duration = await getVideoDuration(file);
          form.setFieldsValue({ duration });
          console.log("视频时长获取成功:", duration, "秒");
        } catch (error) {
          console.warn("获取视频时长失败:", error);
          message.warning("视频上传成功，但获取时长失败，请手动填写");
        }
      }

      setFileList([
        {
          uid: file.name,
          name: file.name,
          status: "done",
          url: fileUrl,
        },
      ]);

      message.success("文件上传成功");
    } catch (error) {
      console.log("error", error);

      message.error("文件上传失败");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      const fileUrl = await uploadImage(file);

      if (!fileUrl) {
        message.error("缩略图上传失败");
        return;
      }

      form.setFieldsValue({ thumbnailUrl: fileUrl });

      setThumbnailFileList([
        {
          uid: file.name,
          name: file.name,
          status: "done",
          url: fileUrl,
        },
      ]);

      message.success("缩略图上传成功");
    } catch (error) {
      message.error("缩略图上传失败");
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileUpload(file);
      return false; // 阻止默认上传
    },
    fileList,
    onRemove: () => {
      setFileList([]);
      form.setFieldsValue({
        resourceUrl: "",
        fileSize: undefined,
        duration: undefined,
      });
    },
  };

  const thumbnailUploadProps = {
    beforeUpload: (file: File) => {
      handleThumbnailUpload(file);
      return false;
    },
    fileList: thumbnailFileList,
    onRemove: () => {
      setThumbnailFileList([]);
      form.setFieldsValue({ thumbnailUrl: "" });
    },
    accept: "image/*",
  };

  return (
    <Modal
      title={resource ? "编辑媒体资源" : "添加媒体资源"}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          icon={<SaveOutlined />}
          loading={saveLoading}
          onClick={handleSave}
          disabled={!isEditable()}
        >
          保存
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={submitLoading}
          onClick={handleSubmitForReview}
          disabled={!canSubmit()}
        >
          {resource ? "提交审核" : "创建并提交审核"}
        </Button>,
      ]}
      width={900}
      destroyOnClose
    >
      {/* 状态显示 */}
      {resource && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">当前状态：</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                resource.status === "published"
                  ? "bg-green-100 text-green-800"
                  : resource.status === "pending"
                  ? "bg-blue-100 text-blue-800"
                  : resource.status === "under_review"
                  ? "bg-yellow-100 text-yellow-800"
                  : resource.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {getStatusLabel(resource.status)}
            </span>
          </div>
          {!isEditable() && (
            <div className="mt-2 text-xs text-gray-500">
              当前状态下无法编辑资源内容
            </div>
          )}
        </div>
      )}



      <Form
        form={form}
        // layout="vertical"
        initialValues={{
          resourceType: "image",
        }}
      >
        {/* 课程关联选择区域 - 只有新增时可以设置 */}
        {!resource && (
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
                  （必须关联到具体课程才能发布）
                </span>
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="grade"
                label="年级"
                rules={[{ required: true, message: "请选择年级" }]}
              >
                <Select
                  placeholder="选择年级"
                  onChange={handleGradeChange}
                  allowClear
                >
                  {grades.map((grade) => (
                    <Option key={grade.id} value={grade.id}>
                      {grade.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="unit"
                label="单元"
                rules={[{ required: true, message: "请选择单元" }]}
              >
                <Select
                  placeholder="选择单元"
                  onChange={handleUnitChange}
                  disabled={!selectedSubject}
                  allowClear
                >
                  {units.map((unit) => (
                    <Option key={unit.id} value={unit.id}>
                      {unit.title}
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
                  disabled={!selectedGrade}
                  allowClear
                >
                  {subjects.map((subject) => (
                    <Option key={subject.code} value={subject.code}>
                      {subject.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="course"
                label="课程"
                rules={[{ required: true, message: "请选择课程" }]}
              >
                <Select
                  placeholder="选择课程"
                  onChange={handleCourseChange}
                  disabled={!selectedUnit}
                  allowClear
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
        )}

        {/* 已关联信息显示区域 - 编辑模式下显示 */}
        {resource && resource.courses && resource.courses.length > 0 && (
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

            {(() => {
              const course = resource.courses[0];
              const unit = findUnitByCourseId(course.id, units);
              
              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">年级：</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {course.grade?.name || '数据加载中...'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">学科：</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {course.subjectInfo?.name || '数据加载中...'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">单元：</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {unit?.title || '数据加载中...'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-16">课程：</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {course.title}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>
        )}

        {/* 基本信息区域 */}
        <Card size="small" className="mb-4">
          <h4 className="text-base font-medium text-gray-900 mb-4">基本信息</h4>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label="资源类型"
              rules={[{ required: true, message: "请选择资源类型" }]}
            >
              <Select placeholder="选择资源类型" disabled={!isEditable()}>
                {resourceTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="resourceType"
              label="文件类型"
              rules={[{ required: true, message: "请选择文件类型" }]}
            >
              <Select placeholder="选择文件类型" disabled={!isEditable()}>
                {fileTypeOptions.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label="资源标题"
            rules={[{ required: true, message: "请输入资源标题" }]}
          >
            <Input placeholder="输入资源标题" disabled={!isEditable()} />
          </Form.Item>

          <Form.Item name="description" label="资源描述">
            <Input.TextArea
              rows={3}
              placeholder="输入资源描述，支持富文本"
              disabled={!isEditable()}
            />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Input
              placeholder="输入标签，多个标签用逗号分隔"
              disabled={!isEditable()}
            />
          </Form.Item>

          {/* 状态选择字段 - 只有管理员和超级管理员可见 */}
          {canModifyStatus() && resource && (
            <Form.Item
              name="status"
              label="发布状态"
              rules={[{ required: true, message: "请选择发布状态" }]}
            >
              <Select placeholder="选择发布状态">
                {statusOptions.map((status) => (
                  <Option key={status.value} value={status.value}>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        status.color === "green"
                          ? "bg-green-500"
                          : status.color === "orange"
                          ? "bg-orange-500"
                          : status.color === "blue"
                          ? "bg-blue-500"
                          : status.color === "red"
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

        {/* 文件上传区域 */}
        <Card size="small" className="mb-4">
          <h4 className="text-base font-medium text-gray-900 mb-4">文件上传</h4>

          <Form.Item
            name="resourceUrl"
            label="资源文件"
            rules={[{ required: true, message: "请上传资源文件" }]}
          >
            <div>
              <Upload {...uploadProps} disabled={!isEditable()}>
                <Button
                  icon={
                    uploadLoading ? <LoadingOutlined /> : <UploadOutlined />
                  }
                  loading={uploadLoading}
                  disabled={!isEditable()}
                >
                  选择文件上传
                </Button>
              </Upload>
              <div className="mt-2 text-xs text-gray-500">
                支持图片格式：JPG、PNG、GIF；视频格式：MP4、AVI、MOV
              </div>
            </div>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.resourceType !== currentValues.resourceType
            }
          >
            {({ getFieldValue }) => {
              const resourceType = getFieldValue("resourceType");

              return resourceType === "video" ? (
                <>
                  <Form.Item name="thumbnailUrl" label="视频缩略图">
                    <Upload {...thumbnailUploadProps} disabled={!isEditable()}>
                      <Button
                        icon={<UploadOutlined />}
                        disabled={!isEditable()}
                      >
                        上传缩略图
                      </Button>
                    </Upload>
                  </Form.Item>

                  {/* 隐藏的字段用于存储视频信息，不显示给用户 */}
                  <Form.Item name="duration" hidden>
                    <InputNumber />
                  </Form.Item>

                  <Form.Item name="fileSize" hidden>
                    <InputNumber />
                  </Form.Item>
                </>
              ) : null;
            }}
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default MediaResourceForm;
