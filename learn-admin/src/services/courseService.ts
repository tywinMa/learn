import api from "./api";
import { logApi, logError, logData } from "../utils/debugLogger";
import { getSubjects } from "./subjectService";

// 课程接口
export interface Course {
  id: string;
  title: string;
  instructor: string;
  subject?: string; // 学科代码，如'math', 'physics'等
  students: number;
  createdAt: string;
  description?: string;
  content?: string;
  sources?: Array<{ type: "image" | "video"; url: string }>;
  courseCode?: string;
  exerciseGroupIds?: string[]; // 关联习题组ID列表
  coverImage?: string; // 课程封面图片

  // 以下是后端API可能返回的字段名，用于类型兼容
  name?: string; // 对应title
  teacher?: { id: string; name: string }; // 教师信息
  teacherName?: string; // 教师名称
  Subject?: { id: string; name: string; code: string }; // 学科详细信息对象
  course_code?: string; // 下划线格式的课程编号
  created_at?: string; // 下划线格式的创建时间
  exerciseGroups?: Array<{ id: string | number; name: string; description?: string }>; // 关联习题组
  subjectName?: string;
}

// 后端课程数据接口
interface BackendCourse {
  id: number | string;
  name?: string;
  title?: string;
  description?: string;
  content?: string;
  courseCode?: string;
  course_code?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  sources?: Array<{ type: "image" | "video"; url: string }>;
  media?: Array<{ type: "image" | "video"; url: string }>;
  subject?: string; // 学科代码，如'math'
  Subject?: { id: string; name: string; code: string }; // 学科详细信息对象
  teacher?: { id: string; name: string };
  exerciseGroups?: Array<{ id: string | number; name: string; description?: string }>; // 关联习题组
  exerciseGroupIds?: string[]; // 习题组ID列表
  exercise_group_ids?: string[]; // 下划线格式的字段
}

// API端点
const API_ENDPOINTS = {
  COURSES: "/api/admin/courses",
};

/**
 * 转换后端课程数据格式为前端格式
 */
const transformBackendCourse = (course: BackendCourse): Course => {
  if (!course || typeof course !== "object") {
    console.error("transformBackendCourse - 输入数据无效:", course);
    throw new Error("Invalid course data");
  }

  if (!course.id) {
    console.error("transformBackendCourse - 缺少id字段:", course);
    throw new Error("Course data missing id field");
  }

  // 尝试获取Subject字段（可能大小写不同）
  const subjectDetailData = course.subject || (course as any).subject;
  const teacherData = course.teacher || (course as any).teacher;

  const result = {
    id: course.id.toString(),
    title: course.title || course.name || "",
    description: course.description || "",
    content: course.content || "",
    // 学科代码 - 直接使用后端的subject字段
    subject: course.subject || subjectDetailData?.code || "unknown",
    // 教师信息
    instructor: teacherData?.name || "未分配教师",
    // 课程编号
    courseCode: course.courseCode || course.course_code || "",
    // 创建日期
    createdAt: course.createdAt || course.created_at || course.updatedAt || new Date().toISOString(),
    // 媒体资源
    sources: course.media || course.sources || [],
    // 关联习题组ID列表
    exerciseGroupIds: course.exerciseGroupIds || course.exercise_group_ids || [],
    // 保留原始字段用于类型兼容
    Subject: subjectDetailData,
    teacher: teacherData,
    exerciseGroups: course.exerciseGroups,
    students: 0, // 暂无学生数量字段
    // 兼容旧版本 - 学科名称
    subjectName: subjectDetailData?.name || "未分类",
  };

  return result;
};

/**
 * 获取课程列表
 */
export const getCourses = async (): Promise<Course[]> => {
  logApi("调用 getCourses API");
  console.log("courseService - 开始获取课程列表");

  try {
    // 实际API调用
    console.log("courseService - 执行实际API调用:", API_ENDPOINTS.COURSES);
    logApi("执行实际 getCourses API 调用");

    // 发送API请求
    // 注意: api.ts的响应拦截器已经提取了data字段，所以apiResponse现在是 { total, courses, ... }
    const apiResponse = (await api.get(API_ENDPOINTS.COURSES)) as unknown as {
      courses: BackendCourse[];
      total: number;
      currentPage?: number;
      totalPages?: number;
    };
    console.log("courseService - API响应结构:", typeof apiResponse, apiResponse ? Object.keys(apiResponse) : "null");

    // 完整打印响应内容供调试
    try {
      console.log("courseService - API响应详情:", JSON.stringify(apiResponse, null, 2));
    } catch (e) {
      console.log("courseService - 无法序列化完整响应:", e);
    }

    // 拦截器已经提取了data字段，所以apiResponse现在直接是 { courses: [], total: X, ... }
    if (apiResponse && apiResponse.courses && Array.isArray(apiResponse.courses)) {
      const { courses, total } = apiResponse;
      console.log(`courseService - 找到courses数组, 共${courses.length}项, API返回总数${total}`);

      // 转换后端数据格式为前端格式
      const mappedCourses = courses.map((course: BackendCourse) => {
        // 尝试获取Subject字段（可能大小写不同）
        const subjectDetailData = course.Subject || (course as any).subject;
        const teacherData = course.teacher || (course as any).teacher;

        return {
          id: course.id.toString(),
          title: course.title || course.name || "",
          description: course.description || "",
          content: course.content || "",
          // 学科代码 - 直接使用后端的subject字段
          subject: course.subject || subjectDetailData?.code || "unknown",
          // 教师信息
          instructor: teacherData?.name || "未分配教师",
          // 课程编号
          courseCode: course.courseCode || course.course_code || "",
          // 创建日期
          createdAt: course.createdAt || course.created_at || course.updatedAt || new Date().toISOString(),
          // 媒体资源
          sources: course.media || course.sources || [],
          // 关联习题组ID列表
          exerciseGroupIds: course.exerciseGroupIds || course.exercise_group_ids || [],
          // 保留原始字段用于类型兼容
          Subject: subjectDetailData,
          teacher: teacherData,
          exerciseGroups: course.exerciseGroups,
          students: 0, // 暂无学生数量字段
          // 兼容旧版本 - 学科名称
          subjectName: subjectDetailData?.name || "未分类",
        };
      });

      console.log("courseService - 数据映射完成, 处理后课程数量:", mappedCourses.length);
      if (mappedCourses.length > 0) {
        console.log("courseService - 处理后第一条数据示例:", {
          ...mappedCourses[0],
          content: mappedCourses[0].content ? `${mappedCourses[0].content.substring(0, 100)}...` : "无内容",
        });
      }
      return mappedCourses;
    }

    // 兜底：尝试从其他可能的数据结构中解析
    console.log("courseService - 尝试其他可能的数据结构");

    // 1. 检查apiResponse本身是否为数组(直接返回课程列表)
    if (Array.isArray(apiResponse)) {
      console.log("courseService - apiResponse本身是数组，直接返回");
      return apiResponse;
    }

    console.error("courseService - 无法解析API响应，返回空数组");
    console.error("courseService - 响应格式:", apiResponse);
    return [];
  } catch (error) {
    console.error("courseService - 获取课程列表失败，错误详情:", error);
    logError("获取课程列表失败", error);
    // 发生错误时返回空数组
    return [];
  }
};

/**
 * 获取单个课程详情
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  logApi(`调用 getCourseById API, id=${id}`);

  try {
    // 实际API调用
    logApi(`执行实际 getCourseById API 调用, id=${id}`);
    console.log(`getCourseById - 请求URL: ${API_ENDPOINTS.COURSES}/${id}`);

    const response = await api.get(`${API_ENDPOINTS.COURSES}/${id}`);

    // API拦截器已经提取了data字段，所以response直接是课程数据
    console.log("getCourseById - API响应类型:", typeof response);
    console.log("getCourseById - API响应内容:", response);

    // 尝试序列化响应以便调试
    try {
      console.log("getCourseById - API响应JSON:", JSON.stringify(response, null, 2));
    } catch (e) {
      console.log("getCourseById - 无法序列化响应:", e);
    }

    if (response && typeof response === "object") {
      console.log("getCourseById - 响应对象的键:", Object.keys(response));

      const course = transformBackendCourse(response as unknown as BackendCourse);
      logData(`获取课程(ID:${id})`, course);
      return course;
    } else {
      console.error("getCourseById - 响应数据格式不正确:", response);
      return null;
    }
  } catch (error) {
    console.error(`getCourseById - 获取课程(ID:${id})失败:`, error);
    logError(`获取课程(ID:${id})失败`, error);
    return null;
  }
};

/**
 * 根据学科代码获取课程列表
 * @param subjectCode 学科代码（如：MATH, CN, ENG）
 */
export const getCoursesBySubject = async (subjectCode: string): Promise<Course[]> => {
  logApi(`调用 getCoursesBySubject API, subjectCode=${subjectCode}`);

  try {
    // 实际API调用 - 根据学科代码获取课程
    logApi(`执行实际 getCoursesBySubject API 调用, subjectCode=${subjectCode}`);
    const response = await api.get(`${API_ENDPOINTS.COURSES}/subject/${subjectCode}`);

    console.log("getCoursesBySubject API响应:", response);

    let courses: Course[] = [];
    // API拦截器已经提取了data字段，所以response现在直接是课程数组
    if (Array.isArray(response)) {
      courses = response.map(transformBackendCourse);
      console.log(`转换后的课程数据(${subjectCode}):`, courses);
    } else {
      console.warn("getCoursesBySubject: API响应格式不正确:", response);
    }

    logData(`获取学科(${subjectCode})的课程`, courses);
    return courses;
  } catch (error) {
    logError(`获取学科(${subjectCode})的课程失败`, error);
    return [];
  }
};

/**
 * 创建新课程
 */
export const createCourse = async (courseData: Omit<Course, "id">): Promise<Course | null> => {
  logApi("调用 createCourse API", { title: courseData.title });
  console.log("创建课程数据:", {
    ...courseData,
    content: courseData.content ? `${courseData.content.substring(0, 100)}...` : "无内容",
  });

  try {
    // 实际API调用
    logApi("执行实际 createCourse API 调用");
    console.log("准备向后端发送POST请求:", API_ENDPOINTS.COURSES);

    // 获取学科数据，将学科名称或代码转换为学科代码
    const subjects = await getSubjects();
    // 优先按学科代码匹配，再按名称匹配
    let subject = subjects.find((s) => s.code === courseData.subjectName);
    if (!subject) {
      subject = subjects.find((s) => s.name === courseData.subjectName);
    }

    if (!subject) {
      throw new Error(`找不到学科: ${courseData.subjectName}`);
    }

    // 转换字段名，将前端的字段映射到后端的字段
    const apiData = {
      id: courseData.courseCode || `C${Date.now().toString().substring(7, 12)}`, // 使用courseCode作为ID，或自动生成
      title: courseData.title, // 后端期望title字段，不是name
      description: courseData.description,
      content: courseData.content, // 确保将content字段包含在API请求中
      subject: subject.code, // 后端期望学科代码，不是学科ID
      media: courseData.sources || [], // 后端期望media字段，不是sources
      exerciseGroupIds: courseData.exerciseGroupIds || [], // 使用习题组ID列表
      teacherId: null, // 暂不设置教师
    };

    console.log("转换后的API请求数据:", {
      ...apiData,
      content: apiData.content ? `${apiData.content.substring(0, 100)}...` : "无内容",
    });

    const response = (await api.post(API_ENDPOINTS.COURSES, apiData)) as unknown as Course;

    logApi("实际 API 返回", { data: response });
    console.log("API响应:", JSON.stringify(response, null, 2));

    // API拦截器已经提取了data字段，所以response直接是课程数据
    return response || null;
  } catch (error) {
    logError("创建课程失败", error);
    console.error("创建课程API错误:", error);
    return null;
  }
};

/**
 * 更新课程
 */
export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course | null> => {
  console.log(`调用 updateCourse API, id=${id}`, {
    title: courseData.title,
    fields: Object.keys(courseData),
  });

  console.log("更新课程数据:", {
    ...courseData,
    content: courseData.content ? `${courseData.content.substring(0, 100)}...` : "无内容",
  });

  try {
    // 实际API调用
    console.log(`执行实际 updateCourse API 调用, id=${id}`);

    // 准备API数据
    const apiData: Record<string, unknown> = {
      // 直接从courseData中映射所有需要的字段
      title: courseData.title, // 后端期望title字段，不是name
      description: courseData.description,
      content: courseData.content,
      media: courseData.sources, // 后端期望media字段，不是sources
      exerciseGroupIds: courseData.exerciseGroupIds,
    };

    // 如果有学科分类，获取对应的学科ID
    if (courseData.subjectName) {
      try {
        const subjects = await getSubjects();
        console.log(
          "获取到学科列表:",
          subjects.map((s) => `${s.name}(${s.code})`)
        );

        // 优先按学科代码匹配（因为前端Select的value是code）
        let subject = subjects.find((s) => s.code === courseData.subjectName);

        // 如果代码匹配失败，尝试按名称匹配（兼容旧数据）
        if (!subject) {
          console.log(`学科代码匹配未找到: ${courseData.subjectName}，尝试按名称匹配`);
          subject = subjects.find((s) => s.name === courseData.subjectName);
        }

        // 如果名称匹配失败，尝试模糊匹配（不区分大小写）
        if (!subject) {
          console.log(`学科名称匹配未找到: ${courseData.subjectName}，尝试模糊匹配`);
          const subjectNameLower = courseData.subjectName.toLowerCase();
          subject = subjects.find((s) => s.name.toLowerCase() === subjectNameLower || s.code.toLowerCase() === subjectNameLower);
        }

        if (subject) {
          console.log(`找到匹配的学科: ${subject.name}, 代码: ${subject.code}`);
          apiData.subject = subject.code; // 后端期望学科代码，不是学科ID
        } else {
          console.warn(`未找到匹配的学科: ${courseData.subjectName}, 将使用第一个可用学科`);

          // 如果实在找不到匹配的学科，使用第一个可用学科
          if (subjects.length > 0) {
            const firstSubject = subjects[0];
            apiData.subject = firstSubject.code; // 后端期望学科代码，不是学科ID
            console.log(`使用默认学科: ${firstSubject.name}, 代码: ${firstSubject.code}`);
          } else {
            console.error("没有可用的学科数据");
          }
        }
      } catch (error) {
        console.error("获取学科数据失败:", error);
        // 继续处理，让后端返回更具体的错误
      }
    }

    // 打印exerciseGroupIds的值，确认是否存在
    console.log("更新课程 - exerciseGroupIds值:", courseData.exerciseGroupIds);

    // 调试：显示完整的URL和请求数据
    console.log(`发送PUT请求到: ${API_ENDPOINTS.COURSES}/${id}`);
    console.log("请求数据:", JSON.stringify(apiData, null, 2));

    // 发送API请求
    try {
      const response = (await api.put(`${API_ENDPOINTS.COURSES}/${id}`, apiData)) as unknown as Course;
      console.log("更新课程成功:", response);

      // API拦截器已经提取了data字段，所以response直接是课程数据
      return response || null;
    } catch (apiError) {
      console.error("API错误:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error(`更新课程(ID:${id})失败:`, error);
    // 抛出错误，让调用者处理
    throw error;
  }
};

/**
 * 删除课程
 */
export const deleteCourse = async (id: string): Promise<boolean> => {
  logApi(`调用 deleteCourse API, id=${id}`);

  try {
    // 实际API调用
    logApi(`执行实际 deleteCourse API 调用, id=${id}`);
    await api.delete(`${API_ENDPOINTS.COURSES}/${id}`);
    logApi(`删除课程(ID:${id})成功`);
    return true;
  } catch (error) {
    logError(`删除课程(ID:${id})失败`, error);
    return false;
  }
};
