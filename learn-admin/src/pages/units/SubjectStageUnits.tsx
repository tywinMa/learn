import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Spin, 
  Empty, 
  Typography, 
  Tag, 
  Button, 
  message,
  Row,
  Col,
  Modal
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  DragOutlined,
  SaveOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { getSubjects } from '../../services/subjectService';
import type { Subject } from '../../services/subjectService';
import { getCoursesBySubject, type Course } from '../../services/courseService';
import { createUnit, getAllUnits, deleteUnitsBySubject, type CreateUnitParams, type Unit } from '../../services/unitService';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './SubjectStageUnits.css';

const { Title, Text } = Typography;

// 定义拖拽项类型
const ItemTypes = {
  COURSE: 'course',
  ACTUAL_COURSE: 'actual_course', // 新增：真正的课程拖拽类型
};

// 定义格子结构 - 修改为存储Course数据
interface GridCell {
  id: string;
  title: string;
  courses: Course[]; // 存储Course数据
}

interface DragItem {
  type: string;
  courseId: string; // 实际是unitId，但保持字段名不变
  sourceCellId?: string;
  index?: number;
}

// 可拖拽的课程项组件
const DraggableCourse: React.FC<{
  course: Course; // 接受Course数据
  isEditMode: boolean;
  index: number;
  cellId: string;
  moveCard?: (dragIndex: number, hoverIndex: number, cellId: string) => void;
}> = ({ course, isEditMode, index, cellId, moveCard }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.COURSE,
    item: { courseId: course.id, sourceCellId: cellId, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: isEditMode,
  });
  
  const [, drop] = useDrop({
    accept: ItemTypes.COURSE,
    hover: (item: DragItem, monitor) => {
      if (!ref.current || !moveCard) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // 如果拖拽的是同一个元素，不做任何操作
      if (dragIndex === hoverIndex && item.sourceCellId === cellId) {
        return;
      }
      
      // 仅当在同一单元格内拖动时才排序
      if (item.sourceCellId === cellId && typeof dragIndex === 'number') {
        // 获取矩形范围
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        // 获取中心点
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        // 获取指针位置
        const clientOffset = monitor.getClientOffset();
        // 获取指针距离顶部的距离
        const hoverClientY = (clientOffset as { y: number }).y - hoverBoundingRect.top;
        
        // 向上拖动，如果没有越过中心点，不做任何操作
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        
        // 向下拖动，如果没有越过中心点，不做任何操作
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
        
        // 执行移动操作
        moveCard(dragIndex, hoverIndex, cellId);
        
        // 更新拖拽项的索引
        item.index = hoverIndex;
      }
    }
  });
  
  // 连接ref
  useEffect(() => {
    if (ref.current) {
      // 应用拖放功能到ref
      drag(drop(ref.current));
    }
  }, [drag, drop]);
  
  return (
    <div
      ref={ref}
      className={`draggable-course ${isDragging ? 'dragging' : ''} ${isEditMode ? '' : 'not-draggable'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isEditMode && <DragOutlined className="mr-2 text-gray-400" />}
          <div className="ml-2">
            <div className="font-medium">{course.title}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <span className="mr-2">{course.courseCode || course.id}</span>
              <span className="mx-1">|</span>
              <span>{course.category}</span>
              <span className="mx-1">|</span>
              <span>{course.instructor}</span>
            </div>
          </div>
        </div>
        <Tag color="blue" className="ml-2">
          课程
        </Tag>
      </div>
    </div>
  );
};

// 可放置课程的格子组件
const CourseGrid: React.FC<{
  cell: GridCell;
  onDrop: (courseId: string, cellId: string, sourceCellId?: string) => void;
  onDelete: (cellId: string) => void;
  isEditMode: boolean;
  onTitleChange: (cellId: string, title: string) => void;
  subject: Subject | undefined;
  moveCard: (dragIndex: number, hoverIndex: number, cellId: string) => void;
}> = ({ cell, onDrop, onDelete, isEditMode, onTitleChange, subject, moveCard }) => {
  const dropRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.COURSE,
    drop: (item: DragItem) => {
      onDrop(item.courseId, cell.id, item.sourceCellId);
      return { cellId: cell.id };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    canDrop: () => isEditMode,
  });

  // 应用ref
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef);
    }
  }, [drop]);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(cell.title);

  const handleTitleChange = () => {
    onTitleChange(cell.id, title);
    setIsEditing(false);
  };

  return (
    <div
      ref={dropRef}
      className={`course-grid ${isOver ? 'over' : ''}`}
    >
      <div className="grid-cell-header" style={{ borderBottom: "1px solid #eee", marginBottom: "10px" }}>
        <div className="flex justify-between items-center w-full pb-2">
          <div 
            className="grid-cell-title" 
            style={{ 
              borderLeft: `4px solid ${subject?.color || '#1890ff'}`, 
              paddingLeft: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              height: '20px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleChange}
                onKeyPress={(e) => e.key === 'Enter' && handleTitleChange()}
                autoFocus
                className="title-input"
                style={{ 
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}
              />
            ) : (
              <div 
                className="title-text" 
                onClick={() => isEditMode && setIsEditing(true)}
              >
                {title}
              </div>
            )}
          </div>
          
          {/* 修改右上角显示为实际课程数 */}
          {cell.courses.length > 0 && (
            <div className="text-blue-500 text-sm font-normal">
              {cell.courses.length}课程
            </div>
          )}
        </div>
        
        {isEditMode && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(cell.id)}
            className="delete-btn"
          />
        )}
      </div>
      
      <div className="grid-cell-courses">
        {cell.courses.length === 0 ? (
          <div className="grid-cell-empty">
            {isEditMode ? (
              <>
                <div className="empty-icon">
                  <DragOutlined style={{ fontSize: '20px', opacity: 0.5 }} />
                </div>
                <div>将课程拖拽到这里</div>
                <div className="text-xs text-gray-400 mt-1">删除版块时课程会返回可用列表</div>
              </>
            ) : '暂无课程'}
          </div>
        ) : (
          cell.courses.map((course, index) => (
            <DraggableCourse 
              key={course.id} 
              course={course} 
              isEditMode={isEditMode}
              index={index}
              cellId={cell.id}
              moveCard={moveCard}
            />
          ))
        )}
      </div>
    </div>
  );
};

// 添加格子组件
const AddGridCell: React.FC<{
  onAdd: () => void;
}> = ({ onAdd }) => {
  return (
    <div 
      className="add-grid-cell"
      onClick={onAdd}
    >
      <div className="add-grid-cell-content">
        <AppstoreAddOutlined className="add-grid-cell-icon" />
        <div className="mt-2 text-gray-500">添加新版块</div>
      </div>
    </div>
  );
};

// 主要组件
const SubjectStageUnits: React.FC = () => {
  // 状态管理
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]); // 改为课程数据
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]); // 改为可用课程
  
  // 获取所有数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('开始获取数据...');
      // 获取学科数据
      const subjectsData = await getSubjects();
      console.log('获取到subjects数据:', subjectsData);
      setSubjects(subjectsData);
      
      // 如果有学科数据，默认选中第一个学科
      if (subjectsData.length > 0 && !selectedSubject) {
        console.log('设置默认选中学科:', subjectsData[0].id);
        console.log('学科ID类型:', typeof subjectsData[0].id);
        console.log('学科详情:', subjectsData[0]);
        setSelectedSubject(String(subjectsData[0].id));
      }
      
      message.success('数据加载成功');
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('加载数据失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []); // 移除selectedSubject依赖避免无限循环
  
  // 组件挂载时获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // 当选中学科变化时，筛选课程并获取课程数据
  useEffect(() => {
    console.log('=== 学科变化效果触发 ===');
    console.log('selectedSubject:', selectedSubject, typeof selectedSubject);
    console.log('subjects.length:', subjects.length);
    console.log('subjects详细信息:', subjects.map(s => ({ id: s.id, idType: typeof s.id, name: s.name, code: s.code })));
    
    if (!selectedSubject || !subjects.length) {
      console.log('跳过处理：selectedSubject或subjects为空');
      return;
    }

    // ⭐ 立即清空现有状态，防止显示旧数据
    console.log('🧹 清空现有状态');
    setGridCells([]);
    setCourses([]);
    setAvailableCourses([]);
    
    // 获取当前学科 - 确保ID类型匹配
    const subject = subjects.find(s => String(s.id) === String(selectedSubject));
    console.log('=== 学科匹配结果 ===');
    console.log('查找条件:', { selectedSubject: String(selectedSubject), type: typeof selectedSubject });
    console.log('找到的学科:', subject);
    
    if (!subject) {
      console.error('❌ 未找到匹配的学科！');
      console.log('可用学科列表:', subjects.map(s => ({ id: String(s.id), name: s.name })));
      return;
    }
    
    console.log('✅ 成功匹配学科:', { id: subject.id, name: subject.name, code: subject.code });
    
    // 获取该学科的课程数据
    const fetchCourses = async () => {
      try {
        console.log('=== 开始获取学科课程 ===');
        console.log('学科信息:', subject);
        console.log('学科代码:', subject.code);
        
        const subjectCourses = await getCoursesBySubject(subject.code);
        console.log(`=== 学科${subject.name}(${subject.code})的课程数据 ===`);
        console.log('获取到的课程数量:', subjectCourses.length);
        console.log('课程数据:', subjectCourses);
        
        // 设置课程数据
        setCourses(subjectCourses);
        
        console.log('=== 课程数据设置完成 ===');
        return subjectCourses;
      } catch (error) {
        console.error('=== 获取课程失败 ===');
        console.error('错误信息:', error);
        setCourses([]);
        setAvailableCourses([]);
        return [];
      }
    };

    // 获取该学科的已保存单元数据
    const fetchUnits = async () => {
      try {
        console.log('=== 开始获取已保存单元 ===');
        
        const allUnits = await getAllUnits();
        console.log('获取到所有单元:', allUnits);
        
        // 筛选当前学科的单元
        const subjectUnits = allUnits.filter(unit => unit.subject === subject.code);
        console.log(`学科${subject.name}(${subject.code})的已保存单元:`, subjectUnits);
        
        console.log('=== 单元数据设置完成 ===');
        return subjectUnits;
      } catch (error) {
        console.error('=== 获取单元失败 ===');
        console.error('错误信息:', error);
        return [];
      }
    };
    
    // 创建默认格子的函数
    const createDefaultCells = () => {
      console.log('=== 创建默认格子 ===');
      console.log('当前学科名称:', subject.name);
      console.log('当前学科代码:', subject.code);
      
      let defaultCells: GridCell[] = [];
      
      // 根据学科创建默认的格子结构
      switch(subject.name) {
        case '语文':
          console.log('✅ 匹配到语文学科，创建语文默认格子');
          defaultCells = [
            { id: '1', title: '语文基础课程', courses: [] },
            { id: '2', title: '现代文阅读', courses: [] },
            { id: '3', title: '古代文学', courses: [] }
          ];
          break;
        case '数学':
          console.log('✅ 匹配到数学学科，创建数学默认格子');
          defaultCells = [
            { id: '1', title: '数学基础', courses: [] },
            { id: '2', title: '数学进阶', courses: [] },
            { id: '3', title: '数学应用', courses: [] }
          ];
          break;
        case '英语':
          console.log('✅ 匹配到英语学科，创建英语默认格子');
          defaultCells = [
            { id: '1', title: '英语听说', courses: [] },
            { id: '2', title: '英语读写', courses: [] },
            { id: '3', title: '英语语法', courses: [] }
          ];
          break;
        case '物理':
          console.log('✅ 匹配到物理学科，创建物理默认格子');
          defaultCells = [
            { id: '1', title: '物理基础', courses: [] },
            { id: '2', title: '物理实验', courses: [] },
            { id: '3', title: '物理应用', courses: [] }
          ];
          break;
        case '化学':
          console.log('✅ 匹配到化学学科，创建化学默认格子');
          defaultCells = [
            { id: '1', title: '化学基础', courses: [] },
            { id: '2', title: '化学实验', courses: [] },
            { id: '3', title: '化学应用', courses: [] }
          ];
          break;
        case '生物':
          console.log('✅ 匹配到生物学科，创建生物默认格子');
          defaultCells = [
            { id: '1', title: '生物基础', courses: [] },
            { id: '2', title: '生物实验', courses: [] },
            { id: '3', title: '生命科学', courses: [] }
          ];
          break;
        case '历史':
          console.log('✅ 匹配到历史学科，创建历史默认格子');
          defaultCells = [
            { id: '1', title: '中国历史', courses: [] },
            { id: '2', title: '世界历史', courses: [] },
            { id: '3', title: '历史研究', courses: [] }
          ];
          break;
        case '地理':
          console.log('✅ 匹配到地理学科，创建地理默认格子');
          defaultCells = [
            { id: '1', title: '自然地理', courses: [] },
            { id: '2', title: '人文地理', courses: [] },
            { id: '3', title: '区域地理', courses: [] }
          ];
          break;
        case '政治':
          console.log('✅ 匹配到政治学科，创建政治默认格子');
          defaultCells = [
            { id: '1', title: '政治理论', courses: [] },
            { id: '2', title: '经济常识', courses: [] },
            { id: '3', title: '法律基础', courses: [] }
          ];
          break;
        case '体育':
          console.log('✅ 匹配到体育学科，创建体育默认格子');
          defaultCells = [
            { id: '1', title: '体育基础', courses: [] },
            { id: '2', title: '体育技能', courses: [] },
            { id: '3', title: '健康教育', courses: [] }
          ];
          break;
        case '音乐':
          console.log('✅ 匹配到音乐学科，创建音乐默认格子');
          defaultCells = [
            { id: '1', title: '音乐基础', courses: [] },
            { id: '2', title: '音乐鉴赏', courses: [] },
            { id: '3', title: '音乐创作', courses: [] }
          ];
          break;
        case '美术':
          console.log('✅ 匹配到美术学科，创建美术默认格子');
          defaultCells = [
            { id: '1', title: '美术基础', courses: [] },
            { id: '2', title: '美术鉴赏', courses: [] },
            { id: '3', title: '美术创作', courses: [] }
          ];
          break;
        case '信息技术':
          console.log('✅ 匹配到信息技术学科，创建信息技术默认格子');
          defaultCells = [
            { id: '1', title: '编程基础', courses: [] },
            { id: '2', title: '数据处理', courses: [] },
            { id: '3', title: '信息系统', courses: [] }
          ];
          break;
        default:
          console.log('⚠️ 使用默认格子模板，学科名称:', subject.name);
          defaultCells = [{ id: '1', title: `${subject.name}基础课程`, courses: [] }];
      }
      
      console.log('🎯 最终创建的默认格子:', defaultCells);
      return defaultCells;
    };
    
    // 并行获取课程和单元数据，然后处理
    Promise.all([fetchCourses(), fetchUnits()]).then(([courses, units]) => {
      console.log('=== 开始处理课程和单元数据 ===');
      console.log('课程数量:', courses.length);
      console.log('单元数量:', units.length);
      
      if (units.length > 0) {
        // 如果有已保存的单元，使用单元数据
        console.log('✅ 使用已保存的单元数据');
        handleSavedUnitsToGrid(courses, units);
      } else {
        // 如果没有已保存的单元，使用默认格子
        console.log('✅ 使用默认格子');
        const defaultCells = createDefaultCells();
        console.log('🔄 设置格子数据:', defaultCells);
        setGridCells(defaultCells);
        setAvailableCourses(courses);
      }
      
      console.log('=== 课程和单元数据处理完成 ===');
    }).catch(error => {
      console.error('❌ 数据处理出错:', error);
      // 发生错误时，至少显示默认格子
      const defaultCells = createDefaultCells();
      setGridCells(defaultCells);
      setAvailableCourses([]);
    });
  }, [selectedSubject, subjects]);
  
  // 监听gridCells变化，自动重新计算可用课程
  useEffect(() => {
    if (courses.length > 0 && gridCells.length > 0) {
      recalculateAvailableCourses();
    }
  }, [gridCells, courses]);
  
  // 处理已保存单元数据，将其转换为格子中的课程显示
  const handleSavedUnitsToGrid = (courses: Course[], units: Unit[]) => {
    if (units.length === 0) {
      // 没有已保存的单元，直接设置所有课程为可用
      setAvailableCourses(courses);
      return;
    }
    
    console.log('=== 处理已保存单元到格子 ===');
    console.log('课程数据:', courses);
    console.log('单元数据:', units);
    
    // 创建课程ID到课程对象的映射
    const courseMap = new Map<string, Course>();
    courses.forEach(course => {
      courseMap.set(course.id, course);
    });
    
    // 用于跟踪已使用的课程ID
    const usedCourseIds = new Set<string>();
    
    // 将单元数据转换为格子数据，按order排序
    const sortedUnits = [...units].sort((a, b) => a.order - b.order);
    
    const newGridCells: GridCell[] = sortedUnits.map((unit, index) => {
      const unitCourses: Course[] = [];
      
      // 将单元中的课程ID转换为课程对象
      if (unit.courseIds && Array.isArray(unit.courseIds)) {
        unit.courseIds.forEach(courseId => {
          const courseIdStr = courseId.toString();
          const course = courseMap.get(courseIdStr);
          if (course) {
            unitCourses.push(course);
            usedCourseIds.add(courseIdStr);
          }
        });
      }
      
      return {
        id: String(index + 1),
        title: unit.title,
        courses: unitCourses
      };
    });
    
    console.log('转换后的格子数据:', newGridCells);
    
    // 设置格子数据
    setGridCells(newGridCells);
    
    // 设置可用课程（移除已使用的课程）
    const availableCourses = courses.filter(course => !usedCourseIds.has(course.id));
    setAvailableCourses(availableCourses);
    
    console.log('已使用的课程ID:', Array.from(usedCourseIds));
    console.log('可用课程:', availableCourses);
    console.log('=== 单元数据处理完成 ===');
  };
  
  // 重新计算可用课程（用于编辑模式时去重）
  const recalculateAvailableCourses = () => {
    // 收集所有格子中已使用的课程ID
    const usedCourseIds = new Set<string>();
    gridCells.forEach(cell => {
      cell.courses.forEach(course => {
        usedCourseIds.add(course.id);
      });
    });
    
    // 从所有课程中过滤出未使用的课程
    const availableCourses = courses.filter(course => !usedCourseIds.has(course.id));
    setAvailableCourses(availableCourses);
    
    console.log('重新计算可用课程 - 已使用课程ID:', Array.from(usedCourseIds));
    console.log('重新计算可用课程 - 可用课程数量:', availableCourses.length);
  };
  
  // 处理同一格子内的卡片排序
  const moveCard = (dragIndex: number, hoverIndex: number, cellId: string) => {
    setGridCells(prevCells => 
      prevCells.map(cell => {
        if (cell.id === cellId) {
          const newCourses = [...cell.courses];
          const draggedCourse = newCourses[dragIndex];
          
          // 移除拖拽的课程
          newCourses.splice(dragIndex, 1);
          // 在新位置插入课程
          newCourses.splice(hoverIndex, 0, draggedCourse);
          
          return { ...cell, courses: newCourses };
        }
        return cell;
      })
    );
  };
  
  // 处理课程拖拽到格子
  const handleUnitDrop = (courseId: string, cellId: string, sourceCellId?: string) => {
    // 查找课程
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    // 如果源和目标是同一个格子，不做任何操作（仅在同一格子内重新排序）
    if (sourceCellId === cellId) return;
    
    // 如果课程来自可用课程区域
    if (sourceCellId === "available") {
      // 添加到目标格子
      setGridCells(prev => 
        prev.map(cell => {
          if (cell.id === cellId) {
            return {
              ...cell,
              courses: [...cell.courses, course]
            };
          }
          return cell;
        })
      );
    } 
    // 如果课程来自其他格子
    else if (sourceCellId) {
      // 从源格子中移除，添加到目标格子
      setGridCells(prev => 
        prev.map(cell => {
          if (cell.id === cellId) {
            return {
              ...cell,
              courses: [...cell.courses, course]
            };
          } else if (cell.id === sourceCellId) {
            return {
              ...cell,
              courses: cell.courses.filter(c => c.id !== courseId)
            };
          }
          return cell;
        })
      );
    }
    // 如果课程被移回可用区域
    else if (cellId === "available") {
      // 从所有格子中移除
      setGridCells(prev => 
        prev.map(cell => ({
          ...cell,
          courses: cell.courses.filter(c => c.id !== courseId)
        }))
      );
    }
  };
  
  // 添加新格子
  const handleAddGridCell = () => {
    const newId = String(gridCells.length + 1);
    const subject = subjects.find(s => s.id === selectedSubject);
    
    setGridCells([
      ...gridCells,
      {
        id: newId,
        title: `${subject?.name || ''}课程模块${newId}`,
        courses: []
      }
    ]);
  };
  
  // 删除格子
  const handleDeleteGridCell = (cellId: string) => {
    // 弹出确认框
    Modal.confirm({
      title: '确认删除',
      content: '删除此版块将会将其中的课程返回到可用课程列表，确定要删除吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 从已删除格子中释放课程回可用列表
        setGridCells(prev => prev.filter(cell => cell.id !== cellId));
        
        message.success('版块已删除，其中的课程已返回可用课程列表');
      }
    });
  };
  
  // 更新格子标题
  const handleGridCellTitleChange = (cellId: string, newTitle: string) => {
    setGridCells(prev => 
      prev.map(cell => 
        cell.id === cellId 
          ? { ...cell, title: newTitle } 
          : cell
      )
    );
  };
  
  // 切换编辑模式
  const toggleEditMode = async () => {
    if (isEditMode) {
      // 检查是否有配置需要保存
      const hasData = gridCells.some(cell => cell.courses.length > 0);
      
      if (hasData) {
        // 显示确认对话框
        Modal.confirm({
          title: '保存配置',
          content: `是否将当前配置保存为${currentSubject?.name || ''}学科的学习单元？`,
          okText: '确认保存',
          cancelText: '取消',
          onOk: async () => {
            await saveConfiguration();
            setIsEditMode(false);
          },
          onCancel: () => {
            setIsEditMode(false);
          }
        });
      } else {
        // 没有数据直接退出编辑模式
        setIsEditMode(false);
        message.info('未检测到需要保存的配置');
      }
    } else {
      setIsEditMode(true);
      // useEffect会自动重新计算可用课程
    }
  };
  
  // 保存配置到数据库
  const saveConfiguration = async () => {
    if (!currentSubject) {
      message.error('请先选择学科');
      return;
    }

    try {
      setLoading(true);
      
      // 先删除该学科的所有现有单元
      console.log(`准备删除学科${currentSubject.name}(${currentSubject.code})的所有现有单元`);
      const deleteSuccess = await deleteUnitsBySubject(currentSubject.code);
      
      if (!deleteSuccess) {
        throw new Error('删除现有单元失败');
      }
      
      console.log('现有单元删除成功，开始保存新配置');
      
      // 遍历每个格子，为每个包含课程的格子创建或更新一个单元
      const savePromises = gridCells
        .filter(cell => cell.courses.length > 0) // 只保存有课程的格子
        .map(async (cell, index) => {
          const courseIds = cell.courses.map(course => parseInt(course.id));
          
          // 生成单元ID
          const unitId = `${currentSubject.code.toLowerCase()}-${cell.id}-${Date.now()}`;
          
          const unitData: CreateUnitParams = {
            id: unitId,
            subject: currentSubject.code,
            title: cell.title,
            description: `包含${cell.courses.length}门课程的学习单元`,
            order: index + 1,
            isPublished: true,
            color: currentSubject.color || '#1677ff',
            secondaryColor: `${currentSubject.color || '#1677ff'}20`, // 20% 透明度
            courseIds: courseIds
          };

          console.log('保存单元数据:', unitData);
          
          const result = await createUnit(unitData);
          if (result) {
            console.log('单元保存成功:', result);
            return result;
          } else {
            throw new Error(`保存单元"${cell.title}"失败`);
          }
        });

      // 等待所有单元保存完成
      const savedUnits = await Promise.all(savePromises);
      
      console.log('所有单元保存完成:', savedUnits);
      message.success(`配置已保存，共创建了${savedUnits.length}个学习单元`);
      
      // 保存成功后重新获取单元数据
      if (currentSubject) {
        try {
          const allUnits = await getAllUnits();
          const subjectUnits = allUnits.filter(unit => unit.subject === currentSubject.code);
          // 将单元数据转换为格子显示
          handleSavedUnitsToGrid(courses, subjectUnits);
          console.log('保存后刷新单元列表:', subjectUnits);
        } catch (error) {
          console.error('刷新单元列表失败:', error);
        }
      }
      
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };
  
  // 获取当前选中的学科
  const currentSubject = subjects.find(s => String(s.id) === String(selectedSubject));
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={isEditMode ? 'edit-mode' : ''}>
        <div className="flex justify-between items-center mb-6">
          <Title level={2} style={{ margin: 0 }}>
            <AppstoreOutlined className="mr-2" />
            单元与课程管理
          </Title>
          <Button 
            type={isEditMode ? "primary" : "default"}
            icon={isEditMode ? <SaveOutlined /> : <EditOutlined />}
            onClick={toggleEditMode}
          >
            {isEditMode ? '保存配置' : '编辑模式'}
          </Button>
        </div>
        
        <Card className="mb-6 shadow-sm">
          <div className="subject-selector mb-6">
            <Text strong className="text-lg mr-4">选择学科：</Text>
            <div className="flex flex-wrap gap-2 mt-3">
              {subjects.map(subject => (
                <div 
                  key={subject.id} 
                  className={`subject-tag ${String(selectedSubject) === String(subject.id) ? 'subject-tag-selected' : ''}`}
                  style={{ 
                    borderColor: String(selectedSubject) === String(subject.id) ? 'transparent' : subject.color || '#1677ff',
                    backgroundColor: String(selectedSubject) === String(subject.id) ? subject.color : 'transparent',
                    boxShadow: String(selectedSubject) === String(subject.id) ? `0 4px 12px ${subject.color}40` : ''
                  }}
                  onClick={() => {
                    console.log('点击学科:', { id: subject.id, name: subject.name });
                    setSelectedSubject(String(subject.id));
                  }}
                >
                  <div className="subject-tag-dot" style={{ backgroundColor: String(selectedSubject) === String(subject.id) ? '#fff' : subject.color || '#1677ff' }}></div>
                  {subject.name}
                </div>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="py-32 flex justify-center">
              <Spin size="large" />
            </div>
          ) : error ? (
            <Empty
              description={
                <span className="text-red-500">{error}</span>
              }
            />
          ) : (
            <div className="mt-4">
              {/* 课程组织区域 */}
              <div className="mb-4">
                <Title level={4}>
                  课程组织器
                  <Text className="ml-2 text-gray-500 font-normal text-sm">
                    {isEditMode ? '编辑模式：拖拽课程组织成学习单元' : '查看模式'}
                  </Text>
                </Title>
              </div>
              
              <Row gutter={[16, 16]}>
                <Col span={isEditMode ? 18 : 24}>
                  <div className="grid-cells">
                    <Row gutter={[16, 16]}>
                      {gridCells.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                          没有格子数据，当前学科：{currentSubject?.name || '未选择'}
                        </div>
                      ) : (
                        gridCells.map(cell => (
                          <Col key={cell.id} span={isEditMode ? 12 : 8}>
                            <CourseGrid 
                              key={cell.id} 
                              cell={cell} 
                              onDrop={handleUnitDrop}
                              onDelete={handleDeleteGridCell}
                              isEditMode={isEditMode}
                              onTitleChange={handleGridCellTitleChange}
                              subject={currentSubject}
                              moveCard={moveCard}
                            />
                          </Col>
                        ))
                      )}
                      
                      {isEditMode && (
                        <Col span={12}>
                          <AddGridCell onAdd={handleAddGridCell} />
                        </Col>
                      )}
                    </Row>
                  </div>
                </Col>
                
                {isEditMode && (
                  <Col span={6}>
                    <AvailableUnitsCard 
                      courses={availableCourses} 
                      subject={currentSubject}
                      onDrop={handleUnitDrop}
                      isEditMode={isEditMode}
                    />
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Card>
      </div>
    </DndProvider>
  );
};

// 可用课程区域组件
const AvailableUnitsCard: React.FC<{
  courses: Course[];
  subject: Subject | undefined;
  onDrop: (courseId: string, cellId: string, sourceCellId?: string) => void;
  isEditMode: boolean;
}> = ({ courses, subject, onDrop, isEditMode }) => {
  const availableDropRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.COURSE,
    drop: (item: DragItem) => {
      if (item.sourceCellId && item.sourceCellId !== "available") {
        onDrop(item.courseId, "available", item.sourceCellId);
      }
      return { cellId: "available" };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
    canDrop: (item) => isEditMode && item.sourceCellId !== "available",
  });

  // 连接ref
  useEffect(() => {
    if (availableDropRef.current) {
      drop(availableDropRef);
    }
  }, [drop]);
  
  return (
    <Card 
      title={
        <div style={{ color: subject?.color || '#1677ff' }}>
          可用课程
          <Tag className="ml-2" color={subject?.color || '#1677ff'}>
            {courses.length}
          </Tag>
        </div>
      }
      className="available-units"
    >
      <div 
        ref={availableDropRef}
        className={`available-units-dropzone ${isOver ? 'drop-over' : ''}`}
      >
        {courses.length === 0 ? (
          <Empty description="暂无可用课程" />
        ) : (
          courses.map((course, index) => (
            <DraggableCourse 
              key={course.id} 
              course={course} 
              isEditMode={true}
              index={index}
              cellId="available"
              moveCard={undefined}
            />
          ))
        )}
      </div>
    </Card>
  );
};

export default SubjectStageUnits;