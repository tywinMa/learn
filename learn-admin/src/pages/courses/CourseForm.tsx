import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, Button, Card, Select, message, Collapse, Typography, Space, Divider, Upload } from 'antd';
import { ArrowLeftOutlined, InfoCircleOutlined, InboxOutlined, LoadingOutlined, BookOutlined, QuestionCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourseById, createCourse, updateCourse } from '../../services/courseService';
import { getExerciseGroupsBySubject } from '../../services/exerciseGroupService';
import { uploadCourseCover, uploadCourseVideo } from '../../services/uploadService';

import type { Course } from '../../services/courseService';
import type { ExerciseGroup } from '../../services/exerciseGroupService';
import type { UploadFile, UploadChangeParam } from 'antd/es/upload/interface';
import { useSubjectStore } from '../../store/subjectStore';

// 导入wangEditor编辑器
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig, SlateElement } from '@wangeditor/editor';
import { Boot } from '@wangeditor/editor';
import formulaModule from '@wangeditor/plugin-formula';

const { Option } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 扩展Window接口以支持我们的全局变量
interface ExtendedWindow extends Window {
  __formulaModuleRegistered?: boolean;
}

// 避免重复注册公式模块
// 创建一个全局变量，只在第一次加载时注册公式模块
if (typeof window !== 'undefined') {
  const extendedWindow = window as ExtendedWindow;
  if (!extendedWindow.__formulaModuleRegistered) {
    Boot.registerModule(formulaModule);
    extendedWindow.__formulaModuleRegistered = true;
  }
}

// 课程表单接口
interface CourseFormData {
  title: string;
  description: string;
  content: string;
  subject: string;
  sources?: Array<{type: 'image' | 'video', url: string}>;
  exerciseGroupIds?: string[];
  students?: number;
  media?: UploadFile[];
  exampleMedia?: Array<{type: 'image' | 'video', url: string}>;
  exampleMediaFiles?: UploadFile[];
}

// LaTeX语法示例
const latexExamples = [
  { name: '基本算术', latex: 'a + b - c \\times d \\div e', desc: '基本加减乘除', output: 'a + b - c × d ÷ e' },
  { name: '分数', latex: '\\frac{a}{b}', desc: '分数格式', output: 'a/b' },
  { name: '上标和下标', latex: 'x^2, y_i', desc: '平方和下标', output: 'x², yᵢ' },
  { name: '根号', latex: '\\sqrt{x} 或 \\sqrt[n]{x}', desc: '平方根和n次方根', output: '√x, ⁿ√x' },
  { name: '积分', latex: '\\int_{a}^{b} f(x) \\, dx', desc: '定积分', output: '∫ f(x) dx' },
  { name: '极限', latex: '\\lim_{x \\to \\infty} f(x)', desc: '极限符号', output: 'limₓ→∞ f(x)' },
  { name: '求和', latex: '\\sum_{i=1}^{n} i^2', desc: '求和符号', output: '∑ᵢ₌₁ⁿ i²' },
  { name: '矩阵', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', desc: '2x2矩阵', output: '[a b; c d]' },
  { name: '希腊字母', latex: '\\alpha, \\beta, \\gamma, \\theta, \\pi', desc: '常用希腊字母', output: 'α, β, γ, θ, π' },
  { name: '方程组', latex: '\\begin{cases} x+y=1 \\\\ x-y=2 \\end{cases}', desc: '线性方程组', output: '{ x+y=1 ; x-y=2 }' },
  { name: '二次方程', latex: 'ax^2 + bx + c = 0', desc: '标准二次方程', output: 'ax² + bx + c = 0' },
  { name: '三角函数', latex: '\\sin(\\theta), \\cos(\\theta), \\tan(\\theta)', desc: '基本三角函数', output: 'sin(θ), cos(θ), tan(θ)' },
  { name: '向量', latex: '\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta', desc: '向量点乘', output: 'vec(a) · vec(b) = |vec(a)||vec(b)|cosθ' },
];

const CourseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const selectedSubject = Form.useWatch('subject', form);
  const [loading, setLoading] = useState(false);
  // 使用zustand的学科状态
  const { subjects, fetchSubjects, isLoading: loadingSubjects } = useSubjectStore();
  const [exercises, setExercises] = useState<ExerciseGroup[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [sources, setSources] = useState<Array<{type: 'image' | 'video', url: string}>>([]);
  const [exampleFileList, setExampleFileList] = useState<UploadFile[]>([]);
  const [exampleMedia, setExampleMedia] = useState<Array<{type: 'image' | 'video', url: string}>>([]);
  const isEditing = !!id;
  const [uploading, setUploading] = useState(false);
  const [uploadingExample, setUploadingExample] = useState(false);
  
  // 用于跟踪当前加载的学科，避免重复请求
  const currentLoadingSubjectRef = useRef<string | null>(null);

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入课程内容...',
    hoverbarKeys: {
      formula: {
        menuKeys: ['editFormula'],
      },
    },
    MENU_CONF: {
      // 为公式编辑器添加默认配置
      insertFormula: {
        // 这里可以添加公式编辑器的配置
      }
    }
  };

  // 工具栏配置 - 确保工具栏包含公式插入按钮
  const toolbarConfig: Partial<IToolbarConfig> = {
    // 设置需要显示的默认工具栏按钮
    toolbarKeys: [
      'headerSelect',
      'blockquote',
      '|',
      'bold',
      'italic',
      'underline',
      'through',
      'sub',
      'sup',
      'code',
      'clearStyle',
      '|',
      'color',
      'bgColor',
      '|',
      'bulletedList',
      'numberedList',
      'todo',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      '|',
      'insertTable',
      'codeBlock',
      'divider',
      'uploadImage',
      // 确保插入公式菜单存在
      'insertFormula',
      '|',
      'undo',
      'redo',
    ]
  };

  // 添加获取习题数据的函数
  const fetchExercises = useCallback(async (subjectCode?: string) => {
    const targetSubject = subjectCode || selectedSubject;
    
    // 如果没有学科代码，跳过加载
    if (!targetSubject) {
      console.log('CourseForm - fetchExercises 跳过：没有学科代码');
      return;
    }
    
    // 避免重复加载同一学科的数据
    if (loadingExercises || currentLoadingSubjectRef.current === targetSubject) {
      console.log('CourseForm - fetchExercises 已在加载中或重复请求，跳过');
      return;
    }
    
    console.log('CourseForm - fetchExercises 被调用, 学科:', targetSubject);
    currentLoadingSubjectRef.current = targetSubject;
    setLoadingExercises(true);
    try {
      const data = await getExerciseGroupsBySubject(targetSubject);
      console.log('CourseForm - 习题数据加载完成, 数量:', data.length);
      console.log('CourseForm - 习题数据示例:', data.length > 0 ? data[0] : '无数据');
      setExercises(data);
    } catch (error) {
      console.error('获取习题数据失败:', error);
      message.error('加载习题数据失败，关联习题功能可能不可用');
      // 设置空数组，避免渲染出错
      setExercises([]);
    } finally {
      setLoadingExercises(false);
      currentLoadingSubjectRef.current = null;
    }
  }, [selectedSubject]); // 只依赖selectedSubject，移除其他容易造成循环的依赖

  // 提取获取课程数据的逻辑为独立函数
  const fetchCourseData = useCallback(async () => {
    if (!isEditing || !id) {
      console.log('CourseForm - 不是编辑模式或缺少ID，跳过加载课程数据');
      return;
    }
    
    console.log(`CourseForm - fetchCourseData 被调用, id=${id}`);
    setLoading(true);
    try {
      const course = await getCourseById(id);
      if (!course) {
        console.error(`CourseForm - 课程(ID:${id})不存在`);
        message.error('未找到课程信息');
        return;
      }

      console.log(`CourseForm - 课程(ID:${id})数据加载成功:`, {
        title: course.name || course.title,
        subject: course.Subject?.name || course.subjectName,
        hasContent: !!course.content,
        exerciseGroupIds: course.exerciseGroupIds
      });

      // 设置表单值
      const exerciseGroupIds = course.exerciseGroups?.map(group => group.id.toString()) || 
                              course.exerciseGroupIds || [];
      console.log('CourseForm - 设置exerciseGroupIds值:', exerciseGroupIds);
      
      form.setFieldsValue({
        title: course.name || course.title,
        description: course.description,
        subject: course.Subject?.code || course.subject || course.subjectName,
        exerciseGroupIds: exerciseGroupIds
      });
      
      // 设置富文本内容
      if (course.content) {
        console.log('CourseForm - 设置富文本内容:', course.content.substring(0, 100) + '...');
        setHtml(course.content);
      } else {
        console.log('CourseForm - 课程没有内容字段或内容为空');
        setHtml(''); // 确保没有内容时也清空编辑器
      }
      
      // 如果有媒体资源，设置sources和文件列表
      if (course.sources && course.sources.length > 0) {
        setSources(course.sources);
        
        // 为每个source创建一个文件项
        const files = course.sources.map((source, index) => ({
          uid: `-${index + 1}`,
          name: `media-${index + 1}.${source.type === 'image' ? 'jpg' : 'mp4'}`,
          status: 'done',
          url: source.url,
          type: source.type === 'image' ? 'image/jpeg' : 'video/mp4',
          thumbUrl: source.type === 'image' ? source.url : undefined,
        }));
        
        setFileList(files as UploadFile[]);
      }
      
      // 如果有例题媒体资源，设置exampleMedia和文件列表
      if (course.exampleMedia && course.exampleMedia.length > 0) {
        setExampleMedia(course.exampleMedia);
        
        // 为每个exampleMedia创建一个文件项
        const exampleFiles = course.exampleMedia.map((media, index) => ({
          uid: `-example-${index + 1}`,
          name: `example-media-${index + 1}.${media.type === 'image' ? 'jpg' : 'mp4'}`,
          status: 'done',
          url: media.url,
          type: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
          thumbUrl: media.type === 'image' ? media.url : undefined,
        }));
        
        setExampleFileList(exampleFiles as UploadFile[]);
      }
      
      message.success('课程数据加载成功');
    } catch (error) {
      console.error('加载课程数据失败:', error);
      message.error('加载课程数据失败，请重试。错误详情: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  }, [isEditing, id]); // 移除form依赖，避免无限循环

  // 加载学科数据 - 使用单独的useEffect确保总是执行
  useEffect(() => {
    console.log('CourseForm - 组件挂载/刷新，加载学科数据');
    fetchSubjects();
  }, [fetchSubjects]);

  // 加载课程数据 - 修复依赖数组，确保在id变化时重新加载
  useEffect(() => {
    // 只在编辑模式下加载课程数据
    if (isEditing && id) {
      fetchCourseData();
    }
  }, [isEditing, id, fetchCourseData]);

  // 监听学科变化，自动加载对应的习题组数据
  useEffect(() => {
    if (selectedSubject) {
      console.log('CourseForm - 学科已选择:', selectedSubject, '开始加载习题组数据');
      fetchExercises();
    }
  }, [selectedSubject]); // 只依赖selectedSubject，避免循环

  // 预加载默认学科的习题数据（编辑模式下或新建时有默认学科）
  useEffect(() => {
    // 如果是新建模式且还没有选择学科，但学科列表已加载，可以预加载第一个学科的习题
    if (!isEditing && !selectedSubject && subjects.length > 0) {
      const defaultSubject = subjects[0].code;
      console.log('CourseForm - 新建模式，预加载默认学科习题:', defaultSubject);
      // 直接调用fetchExercises函数
      fetchExercises(defaultSubject);
    }
  }, [isEditing, selectedSubject, subjects.length]); // 移除fetchExercises依赖，只监听必要的状态变化

  // 编辑器创建完成时的处理函数
  const handleCreated = (editor: IDomEditor) => {
    setEditor(editor);
    
    // 确保公式编辑器在编辑器创建后被正确初始化
    if (editor.getMenuConfig('insertFormula') === undefined) {
      console.warn('公式编辑器未正确加载，尝试重新初始化');
      // 如果需要，可以在这里添加额外的初始化代码
    }
  };

  // 组件销毁时销毁编辑器实例
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const handleSubmit = async (values: CourseFormData) => {
    setLoading(true);
    console.log('提交表单数据:', values);
    console.log('当前编辑器内容:', html);
    
    try {
      // 准备提交的数据
      const formattedValues = {
        ...values,
        content: html, // 确保编辑器的HTML内容保存到content字段
        // 使用收集的sources数组（普通媒体资源）
        sources,
        // 使用收集的exampleMedia数组（例题媒体资源）
        exampleMedia,
        // 使用subjectName字段作为学科分类，将由服务层转换为subjectId
        subjectName: values.subject,
        // 使用exerciseGroupIds字段
        exerciseGroupIds: values.exerciseGroupIds || [],
        instructor: values.exerciseGroupIds && values.exerciseGroupIds.length > 0 ? '关联习题教师' : '', // 保持向后兼容
        students: values.students || 0,
        // 如果是新建课程，生成courseCode作为课程ID
        courseCode: isEditing ? undefined : `C${Date.now().toString().substring(7, 12)}`,
        // 如果是新建课程，添加创建日期
        ...(isEditing ? {} : { createdAt: new Date().toISOString().split('T')[0] })
      };
      
      // 调试日志：确认content字段存在
      console.log(`提交前确认 - content字段: ${formattedValues.content ? '有值' : '无值'}, 长度: ${formattedValues.content ? formattedValues.content.length : 0}`);
      
      console.log('格式化后的提交数据:', {
        ...formattedValues,
        content: formattedValues.content ? `${formattedValues.content.substring(0, 100)}...` : '无内容' 
      });
      
      // 将完整的formattedValues作为JSON字符串输出，以便检查数据完整性
      console.log('完整的formattedValues:', JSON.stringify({
        title: formattedValues.title,
        description: formattedValues.description,
        subjectName: formattedValues.subjectName,
        contentLength: formattedValues.content?.length || 0,
        exerciseGroupIds: formattedValues.exerciseGroupIds,
        sourcesCount: formattedValues.sources?.length || 0,
        exampleMediaCount: formattedValues.exampleMedia?.length || 0
      }));
      
      // 单独输出例题媒体资源数据用于调试
      if (formattedValues.exampleMedia && formattedValues.exampleMedia.length > 0) {
        console.log('例题媒体资源数据:', formattedValues.exampleMedia);
      } else {
        console.log('没有例题媒体资源数据');
      }
      
      let result;
      if (isEditing && id) {
        // 更新课程
        console.log('更新课程, ID:', id);
        result = await updateCourse(id, formattedValues);
      } else {
        // 创建课程
        console.log('创建新课程');
        result = await createCourse(formattedValues as Omit<Course, 'id'>);
      }
      
      console.log('API返回结果:', result);
      
      if (result) {
        message.success(`课程${isEditing ? '更新' : '创建'}成功`);
        navigate('/courses');
      } else {
        throw new Error('API返回结果为空');
      }
    } catch (error) {
      console.error('提交失败:', error);
      message.error(`课程${isEditing ? '更新' : '创建'}失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const insertLatex = (latex: string) => {
    if (editor == null) return;
    editor.focus();
    editor.insertNode({
      type: 'formula',
      value: latex,
      children: [{ text: '' }]
    } as SlateElement);
  };

  const latexCollapseItems = [
    {
      key: '1',
      label: 'LaTeX 数学公式语法参考',
      children: (
        <div className="p-2">
          <Title level={5}>常用 LaTeX 公式语法</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {latexExamples.map((example, index) => (
              <Card size="small" key={index} className="mb-2">
                <div className="flex flex-col">
                  <Text strong>{example.name}</Text>
                  <Text type="secondary" className="mb-1">{example.desc}</Text>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded mb-2">
                    <Text code copyable>{example.latex}</Text>
                    <Text>→</Text>
                    <Text className="text-blue-600">{example.output}</Text>
                  </div>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => insertLatex(example.latex)}
                    className="self-end"
                  >
                    插入
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Divider />
          <Space direction="vertical">
            <Text>• 使用 ^ 表示上标，如 x^2</Text>
            <Text>• 使用 _ 表示下标，如 x_1</Text>
            <Text>• 使用 \frac{`{分子}`}{`{分母}`} 表示分数</Text>
            <Text>• 使用 \sqrt{`{表达式}`} 表示平方根</Text>
            <Text>• 使用 \sum_{`{下限}`}^{`{上限}`} 表示求和</Text>
            <Text>• 使用 \int_{`{下限}`}^{`{上限}`} 表示积分</Text>
            <Text>• 复杂公式用 {`{ }`} 来分组</Text>
          </Space>
        </div>
      ),
    }
  ];

  // 文件上传变更处理
  const handleFileChange = (info: UploadChangeParam<UploadFile>) => {
    // 直接设置文件列表
    setFileList(info.fileList);
    
    // 处理上传中状态
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    
    // 处理上传完成后的状态
    if (info.file.status === 'done') {
      setUploading(false);
      
      // 如果服务器返回了URL，则添加到sources数组
      if (info.file.response && info.file.response.data && info.file.response.data.url) {
        const url = info.file.response.data.url;
        const type = info.file.type?.startsWith('image/') ? 'image' : 'video';
        
        // 添加新的媒体资源到sources数组，避免重复
        if (!sources.some(source => source.url === url)) {
          setSources(prev => [...prev, { type, url }]);
          message.success(`${type === 'image' ? '图片' : '视频'}上传成功`);
        }
      }
    }
    
    // 处理上传失败的情况
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('媒体文件上传失败');
    }
    
    // 处理移除文件的情况
    if (info.file.status === 'removed') {
      // 从sources数组中移除对应项
      const removedFileUrl = info.file.url || (info.file.response?.data?.url);
      if (removedFileUrl) {
        setSources(prev => prev.filter(item => item.url !== removedFileUrl));
      }
    }
    
    // 同步fileList到sources
    const updatedSources = info.fileList
      .filter(file => file.status === 'done' && (file.url || (file.response?.data?.url)))
      .map(file => {
        const url = file.url || file.response?.data?.url;
        const type = file.type?.startsWith('image/') ? 'image' as const : 'video' as const;
        return { type, url };
      });
    
    // 如果还有文件，则更新sources
    if (updatedSources.length > 0) {
      setSources(updatedSources);
    }
  };

  // 例题媒体文件上传变更处理
  const handleExampleFileChange = (info: UploadChangeParam<UploadFile>) => {
    // 直接设置文件列表
    setExampleFileList(info.fileList);
    
    // 处理上传中状态
    if (info.file.status === 'uploading') {
      setUploadingExample(true);
      return;
    }
    
    // 处理上传完成后的状态
    if (info.file.status === 'done') {
      setUploadingExample(false);
      
      // 如果服务器返回了URL，则添加到exampleMedia数组
      if (info.file.response && info.file.response.data && info.file.response.data.url) {
        const url = info.file.response.data.url;
        const type = info.file.type?.startsWith('image/') ? 'image' : 'video';
        
        // 添加新的例题媒体资源到exampleMedia数组，避免重复
        if (!exampleMedia.some(media => media.url === url)) {
          setExampleMedia(prev => [...prev, { type, url }]);
          message.success(`例题${type === 'image' ? '图片' : '视频'}上传成功`);
        }
      }
    }
    
    // 处理上传失败的情况
    if (info.file.status === 'error') {
      setUploadingExample(false);
      message.error('例题媒体文件上传失败');
    }
    
    // 处理移除文件的情况
    if (info.file.status === 'removed') {
      // 从exampleMedia数组中移除对应项
      const removedFileUrl = info.file.url || (info.file.response?.data?.url);
      if (removedFileUrl) {
        setExampleMedia(prev => prev.filter(item => item.url !== removedFileUrl));
      }
    }
    
    // 同步fileList到exampleMedia
    const updatedExampleMedia = info.fileList
      .filter(file => file.status === 'done' && (file.url || (file.response?.data?.url)))
      .map(file => {
        const url = file.url || file.response?.data?.url;
        const type = file.type?.startsWith('image/') ? 'image' as const : 'video' as const;
        return { type, url };
      });
    
    // 如果还有文件，则更新exampleMedia
    if (updatedExampleMedia.length > 0) {
      setExampleMedia(updatedExampleMedia);
    }
  };

  // 自定义上传处理
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    try {
      // 确保file是文件对象
      const uploadFile = file instanceof File ? file : new File([], 'empty');
      
      // 检查文件类型
      const isImage = uploadFile.type.startsWith('image/');
      const isVideo = uploadFile.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        message.error('只支持上传图片或视频文件');
        onError?.(new Error('不支持的文件类型'));
        return;
      }
      
      // 进度模拟
      let percent = 0;
      onProgress?.({ percent });
      
      const progressInterval = setInterval(() => {
        percent = Math.min(95, percent + 5);
        onProgress?.({ percent });
      }, 100);
      
      let url = null;
      
      try {
        if (isImage) {
          // 上传图片
          url = await uploadCourseCover(uploadFile);
        } else if (isVideo) {
          // 上传视频
          url = await uploadCourseVideo(uploadFile);
        }
        
        clearInterval(progressInterval);
        
        if (url) {
          console.log('上传成功，获取到URL:', url);
          onProgress?.({ percent: 100 });
          // 修改响应数据结构以匹配handleFileChange期望的格式
          onSuccess?.({ 
            err_no: 0,
            message: '上传成功',
            data: { url }
          });
        } else {
          clearInterval(progressInterval);
          console.error('上传返回空URL');
          message.error('上传失败: 服务器没有返回有效的文件URL');
          onError?.(new Error('上传失败: 服务器没有返回有效的文件URL'));
        }
      } catch (uploadError) {
        clearInterval(progressInterval);
        console.error('上传过程中发生错误:', uploadError);
        message.error('上传失败: ' + (uploadError instanceof Error ? uploadError.message : '未知错误'));
        onError?.(new Error(uploadError instanceof Error ? uploadError.message : '未知错误'));
      }
    } catch (error) {
      console.error('上传准备过程中发生错误:', error);
      onError?.(new Error(error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col">
      {/* 页面头部 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/courses')}
              type="text"
              size="large"
              className="mr-4 hover:bg-gray-100"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 m-0">
                {isEditing ? '编辑课程' : '创建课程'}
              </h1>
              <p className="text-gray-500 mt-1 mb-0">
                {isEditing ? '修改课程信息和内容' : '创建一门新的课程'}
              </p>
            </div>
          </div>
          {isEditing && (
            <div className="text-right">
              <div className="text-sm text-gray-500">课程ID</div>
              <div className="text-lg font-mono text-gray-700">{id}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* 表单内容区域 - 自适应高度 */}
      <Card className="shadow-sm border border-gray-200 flex-1 flex flex-col">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
          className="flex-1 flex flex-col"
        >
          {/* 表单内容区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto">
            {/* 基本信息区域 */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOutlined className="mr-2 text-blue-500" />
                基本信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="title"
                  label="课程名称"
                  rules={[{ required: true, message: '请输入课程名称' }]}
                >
                  <Input placeholder="请输入课程名称" size="large" />
                </Form.Item>
                
                <Form.Item
                  name="subject"
                  label="学科分类"
                  rules={[{ required: true, message: '请选择学科分类' }]}
                >
                  <Select placeholder="请选择学科分类" loading={loadingSubjects} size="large">
                    {subjects.map(subject => (
                      <Option key={subject.id} value={subject.code}>{subject.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
              
              <Form.Item
                name="description"
                label="课程描述"
                rules={[{ required: true, message: '请输入课程描述' }]}
                className="mb-0"
              >
                <TextArea 
                  placeholder="请简要描述课程内容和特点" 
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </div>

            {/* 关联习题区域 */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QuestionCircleOutlined className="mr-2 text-blue-500" />
                关联习题
              </h3>
              <Form.Item
                name="exerciseGroupIds"
                label="选择习题组"
                help="选择多个习题组与本课程关联，学生可以通过课程直接访问相关练习（可选）"
                className="mb-0"
              >
                <Select 
                  mode="multiple"
                  placeholder="请选择关联习题组" 
                  loading={loadingExercises}
                  allowClear
                  showSearch
                  size="large"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {exercises.map(exercise => {
                    // 安全地处理习题ID和编号显示
                    let displayNumber = '';
                    if (exercise.id) {
                      // 使用ID，确保转换为字符串
                      const exerciseId = exercise.id.toString();
                      if (exerciseId.includes('-')) {
                        // 如果是类似 "exercise-123" 的格式，提取最后一部分
                        displayNumber = `G${exerciseId.split('-').pop() || ''}`;
                      } else {
                        // 直接使用ID
                        displayNumber = `G${exerciseId}`;
                      }
                    }
                    
                    const label = `${displayNumber} - ${exercise.name || '无标题'}`;
                    
                    return (
                      <Option key={exercise.id} value={exercise.id.toString()}>
                        {label}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </div>

            {/* 媒体资源区域 */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <InboxOutlined className="mr-2 text-blue-500" />
                媒体资源
              </h3>
              <Form.Item
                name="sources"
                label="课程封面图片/视频"
                extra="支持上传多个图片或视频文件作为课程媒体资源"
                className="mb-6"
              >
                <Dragger 
                  fileList={fileList}
                  onChange={handleFileChange}
                  multiple={true}
                  listType="picture"
                  accept=".jpg,.jpeg,.png,.gif,.mp4,.webm"
                  customRequest={customUpload}
                  showUploadList={{ showRemoveIcon: true }}
                >
                  <p className="ant-upload-drag-icon">
                    {uploading ? <LoadingOutlined /> : <InboxOutlined />}
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持多个图片或视频上传，推荐图片尺寸: 1280x720px，大小不超过20MB
                  </p>
                </Dragger>
              </Form.Item>
              
              <Form.Item
                name="exampleMedia"
                label="例题媒体资源"
                extra="支持上传例题相关的图片或视频文件，将在学习内容结束后展示"
                className="mb-0"
              >
                <Dragger 
                  fileList={exampleFileList}
                  onChange={handleExampleFileChange}
                  multiple={true}
                  listType="picture"
                  accept=".jpg,.jpeg,.png,.gif,.mp4,.webm"
                  customRequest={customUpload}
                  showUploadList={{ showRemoveIcon: true }}
                >
                  <p className="ant-upload-drag-icon">
                    {uploadingExample ? <LoadingOutlined /> : <InboxOutlined />}
                  </p>
                  <p className="ant-upload-text">点击或拖拽例题文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持多个例题图片或视频上传，推荐视频尺寸: 1280x720px，大小不超过20MB
                  </p>
                </Dragger>
              </Form.Item>
            </div>
            
            {/* 课程内容区域 */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <EditOutlined className="mr-2 text-blue-500" />
                课程内容
              </h3>
              <Form.Item
                label="富文本编辑器"
                rules={[{ required: true, message: '请输入课程内容' }]}
                className="mb-0"
              >
                <div className="border rounded-md" style={{ border: '1px solid #d9d9d9', zIndex: 100 }}>
                  <Toolbar
                    editor={editor}
                    defaultConfig={toolbarConfig}
                    mode="default"
                    style={{ borderBottom: '1px solid #d9d9d9' }}
                  />
                  <Editor
                    defaultConfig={editorConfig}
                    value={html}
                    onCreated={handleCreated}
                    onChange={editor => setHtml(editor.getHtml())}
                    mode="default"
                    style={{ height: '400px', overflowY: 'hidden' }}
                  >
                  </Editor>
                </div>
                <div className="text-gray-500 text-xs mt-2 flex items-center">
                  <InfoCircleOutlined className="mr-1" /> 提示：双击已插入的公式可以编辑。点击工具栏中的"公式"按钮可以插入新的数学公式。
                </div>
              </Form.Item>
            </div>

            {selectedSubject === '数学' && (
              <div className="mb-6">
                <Collapse items={latexCollapseItems} />
              </div>
            )}
          </div>
          
          {/* 操作按钮区域 - 固定在底部 */}
          <div className="bg-white border-t border-gray-200 pt-6 mt-6 flex-shrink-0">
            <div className="flex justify-end gap-3">
              <Button size="large" onClick={() => navigate('/courses')}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading}>
                {isEditing ? '更新课程' : '创建课程'}
              </Button>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CourseForm; 