import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View as RNView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useRouter, useLocalSearchParams } from "expo-router";
import { getMultipleUnitProgress, USER_ID as PROGRESS_USER_ID, type UnitProgress } from "../services/progressService";
import { getUserPoints } from "../services/pointsService";
import SubjectModal from "@/components/SubjectModal";
import { useSubject, Subject } from "@/hooks/useSubject";
import { API_BASE_URL } from "@/constants/apiConfig";

// 学科信息存储键
const CURRENT_SUBJECT_KEY = "currentSubject";

// 保存当前学科到AsyncStorage
const saveCurrentSubject = async (subject: any) => {
  try {
    await AsyncStorage.setItem(CURRENT_SUBJECT_KEY, JSON.stringify(subject));
    console.log("学科已保存:", subject.name);
  } catch (error) {
    console.error("保存学科出错:", error);
  }
};

// 从AsyncStorage加载学科
const loadCurrentSubject = async () => {
  try {
    const savedSubject = await AsyncStorage.getItem(CURRENT_SUBJECT_KEY);
    if (savedSubject) {
      return JSON.parse(savedSubject);
    }
    return null;
  } catch (error) {
    console.error("加载学科出错:", error);
    return null;
  }
};

const AVERAGE_EXPECTED_ITEM_Y_INCREMENT = 120; // Average height of a regular level item

// 关卡组件
const Level = ({
  level,
  color,
  isLast,
  unitTitle,
  progress,
  previousLevelUnlocked,
  courses,
  currentSubject,
  progressData,
  onShowLockTooltip,
  levelIndex,
  exerciseTop,
  onNonExerciseLayout,
}: {
  level: any;
  color: string;
  isLast: boolean;
  unitTitle: string;
  progress?: any;
  previousLevelUnlocked?: boolean;
  courses: any[];
  currentSubject: any;
  progressData: Record<string, UnitProgress>;
  onShowLockTooltip: (levelId: string, event: any) => void;
  levelIndex: number;
  exerciseTop?: number;
  onNonExerciseLayout?: (levelId: string, layout: { height: number, y: number }) => void;
}) => {
  // @ts-ignore - 添加router变量
  const router = useRouter();

  // 计算关卡是否锁定
  // 第一个关卡默认解锁，其他关卡需要前一个关卡达到3星才解锁
  // 但大单元的第一个小单元（格式为x-1）也可以访问
  const isFirstLessonOfUnit = level && level.id && level.id.split("-").length === 3 && level.id.split("-")[2] === "1";
  const isLocked = previousLevelUnlocked === false && !isFirstLessonOfUnit;
  const isExerciseUnit = level.unitType === "exercise";
  const exerciseUnitPosition = level.position;
  // 判断是否为大单元
  const isMajorUnit = level.isMajor === true;

  // 获取星星数量
  const stars = progress?.stars || 0;
  // 处理关卡点击
  const handleLevelPress = (event: any) => {
    if (isLocked) {
      // 显示锁定提示tooltip
      onShowLockTooltip(level.id, event);
      return;
    }

    // 检查当前关卡是否是某个大单元的第一个小单元
    if (isFirstLessonOfUnit && previousLevelUnlocked === false) {
      console.log("访问大单元的第一个小单元:", level.id);

      // 获取当前单元的完整颜色信息
      const courseIndex = parseInt(level.id.split("-")[1]) - 1;
      const course = courses.find((c) => c.id === `unit${courseIndex + 1}`);

      // 使用关卡所属单元的颜色，或默认使用当前学科颜色
      const levelColor = course ? course.color : color;
      const levelSecondaryColor = course ? course.secondaryColor : color;

      // 导航到学习页面并带上解锁参数
      const params = {
        id: level.id,
        unitTitle: `${unitTitle} - ${level.title}`,
        color: levelColor,
        secondaryColor: levelSecondaryColor,
        subject: currentSubject.code,
        isUnlockingTest: "true", // 标记这是一个解锁测试
        unlockPreviousUnits: "true", // 标记需要解锁之前的单元
      };

      router.push({
        pathname: "/study",
        params,
      });
      return;
    }

    // 确保level.id存在
    if (!level || !level.id) {
      console.error("关卡ID不存在", level);
      Alert.alert("错误", "无法加载该关卡，关卡ID不存在");
      return;
    }

    // 获取当前单元的完整颜色信息
    const courseIndex = parseInt(level.id.split("-")[0]) - 1;
    const course = courses.find((c) => c.id === `unit${courseIndex + 1}`);

    // 使用关卡所属单元的颜色，或默认使用当前学科颜色
    const levelColor = course ? course.color : color;
    const levelSecondaryColor = course ? course.secondaryColor : color;

    // 导航到学习页面（独立页面，不是tab）
    const params = {
      id: level.id,
      unitTitle: `${unitTitle} - ${level.title}`,
      color: levelColor,
      secondaryColor: levelSecondaryColor,
      subject: currentSubject.code,
    };

    // 使用Expo Router的导航功能，提供更流畅的体验
    router.push({
      pathname: "/study",
      params,
    });
  };

  // 计算完成状态
  const isCompleted = stars > 0;

  // 根据类型和状态选择样式
  const getBadgeStyle = () => {
    // 大单元基础样式 - 更大的徽章
    const badgeBaseStyle = isMajorUnit 
      ? { 
          width: 80, 
          height: 80, 
          borderRadius: 40,
          borderWidth: 3
        } 
      : {};

    if (isLocked) {
      return {
        backgroundColor: "#E5E5E5",
        borderColor: "#CCCCCC",
        ...badgeBaseStyle
      };
    }

    if (isFirstLessonOfUnit && previousLevelUnlocked === false) {
      // 大单元的第一个小单元特殊样式，显示为可点击但有特殊标记
      return {
        backgroundColor: "white",
        borderColor: color,
        borderWidth: isMajorUnit ? 3 : 2,
        borderStyle: "dashed" as "dashed",
        ...badgeBaseStyle
      };
    }

    if (isCompleted) {
      return {
        backgroundColor: color,
        borderColor: color,
        ...badgeBaseStyle
      };
    }

    return {
      backgroundColor: "white",
      borderColor: color,
      borderWidth: isMajorUnit ? 3 : 2,
      ...badgeBaseStyle
    };
  };

  const getExerciseLevelContainerStyle = () => {
    const style: any = {
      position: "absolute",
      // Use exerciseTop if provided, otherwise fallback to index-based calculation
      top: typeof exerciseTop === 'number' ? exerciseTop : levelIndex * AVERAGE_EXPECTED_ITEM_Y_INCREMENT,
      width: 100, // Fixed width for exercise units
      zIndex: 10, // Ensure it's above other elements if overlapping
      alignItems: 'center', // Center content within the exercise unit
    };
    if (level.position === "left") {
      style.left = 5; // Small margin from the left edge
    } else if (level.position === "right") {
      style.right = 5; // Small margin from the right edge
    } else {
      // Default to left if position is not specified or invalid
      style.left = 5;
    }
    return style;
  };

  const getIconName = () => {
    // 大单元使用特定图标
    if (isMajorUnit) {
      if (isLocked) {
        return "lock";
      }
      if (isCompleted) {
        return "crown";  // 使用皇冠图标表示已完成的大单元
      }
      return "bookmark";  // 使用书签图标表示大单元
    }

    if (isLocked) {
      return "lock";
    }

    if (isFirstLessonOfUnit && previousLevelUnlocked === false) {
      return "flag"; // 使用旗帜图标表示这是大单元的入口点
    }

    if (isCompleted) {
      return "star";
    }
    return "play";
  };

  const getIconColor = () => {
    if (isLocked) {
      return "#AAAAAA";
    }

    if (isFirstLessonOfUnit && previousLevelUnlocked === false) {
      return "#FF9600"; // 使用橙色表示特殊入口点
    }

    if (isCompleted) {
      return "white";
    }
    return color;
  };

  const getTitleStyle = () => {
    // 大单元使用更大、更粗的标题文字
    return {
      ...styles.levelTitle,
      ...(isMajorUnit && { 
        fontSize: 18, 
        fontWeight: '700' as 'bold',
        marginTop: 8  // 增加大单元标题与徽章的间距
      })
    };
  };

  return (
    <RNView
      style={[
        isExerciseUnit
          ? getExerciseLevelContainerStyle() // Use new style for exercise units
          : styles.levelContainer,
      ]}
      onLayout={(event) => {
        if (!isExerciseUnit && onNonExerciseLayout) {
          const { height, y } = event.nativeEvent.layout;
          onNonExerciseLayout(level.id, { height, y });
        }
      }}
    >
      <TouchableOpacity style={[styles.levelBadge, getBadgeStyle()]} disabled={level.locked} onPress={handleLevelPress}>
        <FontAwesome5 
          name={getIconName()} 
          size={isMajorUnit ? 28 : 22} 
          color={getIconColor()} 
        />
      </TouchableOpacity>

      {/* 关卡标题 */}
      <Text style={getTitleStyle()}>{level.title}</Text>

      {/* 星星评分 */}
      <RNView style={styles.starsContainer}>
        {[...Array(3)].map((_, i) => (
          <FontAwesome5
            key={i}
            name="star"
            size={isMajorUnit ? 14 : 10}
            solid={i < stars}
            color={i < stars ? "#FFD900" : "#E0E0E0"}
            style={{ marginHorizontal: 1 }}
          />
        ))}
      </RNView>

      {/* 连接线 */}
      {!isLast && !isExerciseUnit && (
        <RNView
          style={[
            styles.connector,
            {
              backgroundColor: isCompleted ? color : "#E5E5E5",
              width: isMajorUnit ? 4 : 3,  // 大单元使用更粗的连接线
            },
          ]}
        />
      )}
    </RNView>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  // 使用useLocalSearchParams获取路由参数
  const params = useLocalSearchParams();
  const [currentUnit, setCurrentUnit] = useState(0);
  // 心 临时数据，实际数据从后端获取
  const [hearts, setHearts] = useState(5);
  // 连续天数 临时数据，实际数据从后端获取
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [progressData, setProgressData] = useState<Record<string, UnitProgress>>({});
  const [error, setError] = useState<string | null>(null);

  // State to store layout information for non-exercise levels
  const [nonExerciseLevelLayouts, setNonExerciseLevelLayouts] = useState<Record<string, { height: number, y: number }>>({});

  // 从expo-router获取刷新触发参数
  const refreshTrigger = params.refresh as string | undefined;
  const urlSubjectCode = params.currentSubject as string | undefined;

  // 添加学科切换相关状态
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const { currentSubject, setCurrentSubject } = useSubject();

  // 添加课程数据状态 - 替代硬编码的COURSES
  const [courses, setCourses] = useState<any[]>([]);

  // 添加加载状态
  const [loadingCourses, setLoadingCourses] = useState(true);

  // 添加tooltip相关状态
  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const bigUnitHeight = useRef<any>([]);

  // Fallback height for non-exercise items if layout is not yet known
  const FALLBACK_NON_EXERCISE_ITEM_VERTICAL_SPACE = 120;

  // Callback to handle layout reporting from non-exercise Level components
  const handleNonExerciseLayout = (levelId: string, layout: { height: number, y: number }) => {
    setNonExerciseLevelLayouts(prev => {
      // Only update if layout data has changed to prevent unnecessary re-renders
      if (prev[levelId]?.height !== layout.height || prev[levelId]?.y !== layout.y) {
        return { ...prev, [levelId]: layout };
      }
      return prev;
    });
  };

  // 添加课程数据修复函数，确保颜色信息正确
  const ensureCoursesColors = (coursesData: any[]): any[] => {
    return coursesData.map((course) => {
      if (!course) return course;

      // 确保主色存在，否则使用默认颜色
      const primaryColor = course.color || currentSubject.color || "#58CC02";

      // 确保次要色存在，否则基于主色生成
      const secondaryColor = course.secondaryColor || getLighterColor(primaryColor);

      return {
        ...course,
        color: primaryColor,
        secondaryColor: secondaryColor,
      };
    });
  };

  // 组件挂载后初始化位置数据和加载默认学科课程
  useEffect(() => {
    // 尝试加载保存的学科或加载默认学科
    const initSubject = async () => {
      try {
        // 尝试从本地存储加载
        const savedSubject = await loadCurrentSubject();

        if (savedSubject) {
          console.log("从存储中加载学科:", savedSubject.name);
          setCurrentSubject(savedSubject);
          fetchSubjectCourses(savedSubject.code);
        } else {
          // 从服务器获取默认学科(数学)
          const response = await fetch(`${API_BASE_URL}/api/subjects/math`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              console.log("从服务器加载默认学科:", result.data.name);
              setCurrentSubject(result.data);
              fetchSubjectCourses(result.data.code);
            } else {
              // 加载失败时使用本地默认值
              fetchSubjectCourses("math");
            }
          } else {
            // 加载失败时使用本地默认值
            fetchSubjectCourses("math");
          }
        }
      } catch (error) {
        console.error("初始化学科失败:", error);
        // 出错时使用默认值
        fetchSubjectCourses("math");
      }
    };

    initSubject();
  }, []);

  // 修改formatCoursesData返回值，应用颜色修复
  const formatCoursesData = (unitsData: any[], subject: any) => {
    // 验证参数
    if (!unitsData || !Array.isArray(unitsData) || !subject) {
      console.error("格式化课程数据参数无效：", { unitsData, subject });
      return [];
    }

    // 首先按level和order排序
    const sortedUnits = [...unitsData].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.order - b.order;
    });

    // 按大单元分组
    // 先找出所有的大单元 (isMajor = true)
    const majorUnits = sortedUnits.filter(unit => unit.isMajor === true);
    const unitsByMajor: Record<string, any[]> = {};

    // 使用每个大单元的ID作为键初始化分组
    majorUnits.forEach(majorUnit => {
      unitsByMajor[majorUnit.id] = [majorUnit];
    });

    // 将小单元添加到对应的大单元组中
    sortedUnits.forEach(unit => {
      // 跳过大单元，因为它们已经在分组中了
      if (unit.isMajor === true) return;
      
      // 如果有parentId，将小单元添加到对应的大单元组
      if (unit.parentId && unitsByMajor[unit.parentId]) {
        unitsByMajor[unit.parentId].push(unit);
      } else {
        // 如果没有找到对应的大单元组，使用level分组的后备逻辑
        const levelKey = `level-${unit.level}`;
        if (!unitsByMajor[levelKey]) {
          unitsByMajor[levelKey] = [];
        }
        unitsByMajor[levelKey].push(unit);
      }
    });

    // 转换为课程格式
    const formattedCourses = Object.keys(unitsByMajor).map((majorUnitId, index) => {
      const units = unitsByMajor[majorUnitId];
      // 第一个单元通常是大单元本身
      const firstUnit = units[0];

      // 使用单元自己的颜色或回退到学科颜色
      const unitColor = firstUnit.color || subject.color;
      const unitSecondaryColor = firstUnit.secondaryColor || getLighterColor(unitColor);

      return {
        id: `unit${index + 1}`,
        title: firstUnit.title,
        description: firstUnit.description || `学习${subject.name}基础知识`,
        icon: firstUnit.iconUrl || "https://i.imgur.com/QgQQXTI.png",
        color: unitColor,
        secondaryColor: unitSecondaryColor,
        levels: units.map((u) => {
          // 使用API返回的subject字段，如果存在
          const subjectCode = u.subject || subject.code || "unknown";

          // 确保code字段存在
          if (!u.code) {
            console.warn("单元缺少code字段：", u);
            return {
              id: `${subjectCode}-${u.id || index}`,
              title: u.title || "未命名单元",
              unitType: u.unitType || "normal",
              position: u.position || "default",
              isMajor: u.isMajor || false
            };
          }

          // 构建完整的关卡ID，格式为 subjectCode-levelCode
          const levelId = `${subjectCode}-${u.code}`;

          return {
            id: levelId,
            title: u.title || "未命名关卡",
            unitType: u.unitType || "normal",
            position: u.position || "default",
            isMajor: u.isMajor || false
          };
        }),
      };
    });

    // 应用颜色修复
    return ensureCoursesColors(formattedCourses);
  };

  // 生成较浅的颜色作为secondaryColor
  const getLighterColor = (hexColor: string): string => {
    // 从十六进制颜色中提取RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // 计算较浅的颜色（混合白色）
    const lighterR = Math.min(255, r + 50);
    const lighterG = Math.min(255, g + 50);
    const lighterB = Math.min(255, b + 50);

    // 转回十六进制
    return `#${lighterR.toString(16).padStart(2, "0")}${lighterG.toString(16).padStart(2, "0")}${lighterB
      .toString(16)
      .padStart(2, "0")}`;
  };

  // 监听滚动
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const height = bigUnitHeight.current.reduce((result: any, current: any, index: any) => {
      if (index === 0) {
        return [current];
      } else {
        return [...result, result[result.length - 1] + current];
      }
    }, []);
    let currentUnit = 0;
    for (let i = 0; i < height.length; i++) {
      if (currentScrollY + 200 < height[i]) {
        currentUnit = i;
        break;
      }
    }
    setCurrentUnit(currentUnit);
  };

  // 处理学科切换
  const handleSubjectSelect = (subject: Subject) => {
    // 关闭模态框
    setShowSubjectModal(false);

    // 如果选择的是当前学科，不做任何操作
    if (subject.code === currentSubject.code) {
      return;
    }

    // 保存学科到上下文和AsyncStorage
    saveCurrentSubject(subject);

    // 弹出一个提示，表示已切换学科
    Alert.alert("学科已切换", `您已成功切换到${subject.name}学科`, [
      {
        text: "好的",
        style: "default",
        onPress: () => {
          // 使用expo-router导航刷新应用
          router.replace({
            pathname: "/",
            params: {
              refresh: Date.now().toString(),
              currentSubject: subject.code,
            },
          });
        },
      },
    ]);

    // 更新本地状态
    setCurrentSubject(subject);
    setError(null);
    setProgressData({});
    setCurrentUnit(0);
    setCourses([]); // 清空当前课程数据
    setLoadingCourses(true); // 显示加载状态

    // 获取新学科的课程数据
    fetchSubjectCourses(subject.code);
  };

  // 分阶段获取用户进度数据和积分
  const fetchUserData = async (coursesData = courses) => {
    if (coursesData.length === 0) return;

    setError(null);

    try {
      // 立即异步获取积分数据
      getUserPoints(PROGRESS_USER_ID)
        .then((points) => {
          console.log("积分获取成功:", points);
          setXp(points);
        })
        .catch((error) => {
          console.error("获取积分出错:", error);
        });

      // 按阶段获取进度数据
      for (let i = 0; i < coursesData.length; i++) {
        // 设置延迟，避免同时发送太多请求
        const delay = i * 500;
        setTimeout(() => {
          fetchProgressByStage(i, coursesData);
        }, delay);
      }
    } catch (error: any) {
      console.error("获取用户数据出错:", error);
      setError(error.message || "获取用户进度时出错，将显示默认进度");
    }
  };

  // 监听URL参数和刷新触发器，当它们变化时重新加载数据
  useEffect(() => {
    if (refreshTrigger) {
      console.log("检测到刷新触发，刷新时间戳:", refreshTrigger);

      // 如果有URL学科参数，先加载该学科
      if (urlSubjectCode) {
        console.log("从路由参数加载学科:", urlSubjectCode);
        fetchSubjectCourses(urlSubjectCode);
      } else if (courses.length > 0) {
        // 否则只刷新当前学科的数据
        fetchUserData();
      }
    }
  }, [refreshTrigger, urlSubjectCode]);

  // 按阶段获取进度数据的函数
  const fetchProgressByStage = async (stageIndex: number, coursesData = courses) => {
    if (stageIndex < 0 || stageIndex >= coursesData.length) return;

    try {
      // 获取当前阶段的所有关卡ID
      const levelIds: string[] = [];
      coursesData[stageIndex].levels.forEach((level: any) => {
        levelIds.push(level.id);
      });

      console.log(`正在获取第${stageIndex + 1}阶段进度数据...`);
      const stageProgress = await getMultipleUnitProgress(levelIds);

      // 合并到现有进度数据
      setProgressData((prevData) => ({
        ...prevData,
        ...stageProgress,
      }));

      console.log(`第${stageIndex + 1}阶段进度数据获取成功`);
    } catch (error: any) {
      console.error(`获取第${stageIndex + 1}阶段进度数据出错:`, error);
      // 错误不影响UI展示，也不设置全局错误
    }
  };

  // 处理路由中传递的学科参数
  useEffect(() => {
    const handleUrlSubject = async () => {
      if (urlSubjectCode && urlSubjectCode !== currentSubject.code) {
        console.log("从路由参数接收学科代码:", urlSubjectCode);

        try {
          // 获取学科详情
          const response = await fetch(`${API_BASE_URL}/api/subjects/${urlSubjectCode}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const subjectData = result.data;
              // 构建完整的学科对象
              const subject = {
                id: subjectData.id,
                name: subjectData.name,
                code: subjectData.code,
                description: subjectData.description || "学习基础知识",
                color: subjectData.color || "#58CC02",
                iconName: subjectData.iconName || "book",
              };

              // 更新当前学科并获取课程
              setCurrentSubject(subject);
              saveCurrentSubject(subject);
              fetchSubjectCourses(subject.code);
            }
          }
        } catch (error) {
          console.error("获取学科详情出错:", error);
        }
      }
    };

    handleUrlSubject();
  }, [urlSubjectCode]);

  const renderFixedBanner = () => {
    if (currentUnit === -1 || courses.length === 0) return null;
    // 确保currentUnit有效
    const validUnit = Math.min(currentUnit, courses.length - 1);
    const course = courses[validUnit];

    if (!course) {
      console.error("无法渲染FixedBanner：找不到课程信息", {
        currentUnit,
        coursesLength: courses.length,
      });
      return null;
    }

    // 使用默认颜色作为备选方案
    const primaryColor = course.color || "#58CC02";
    const secondaryColor = course.secondaryColor || getLighterColor(primaryColor);

    return (
      <RNView style={styles.fixedBannerContainer}>
        <LinearGradient
          colors={[primaryColor, secondaryColor]}
          style={styles.unitHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <RNView style={styles.unitTitleRow}>
            <Text style={styles.unitTitle}>第 {validUnit + 1} 阶段</Text>
          </RNView>
          <Text style={styles.unitSubtitle}>{course.title}</Text>
        </LinearGradient>
      </RNView>
    );
  };

  // 处理显示tooltip的函数
  const handleShowLockTooltip = (levelId: string, event: any) => {
    if (showLockTooltip) return;

    const { pageY } = event.nativeEvent;
    // 固定水平位置(屏幕左侧)，只使用垂直位置
    setTooltipPosition({ x: 20, y: pageY });
    setShowLockTooltip(true);

    // 3秒后自动隐藏tooltip
    setTimeout(() => {
      setShowLockTooltip(false);
    }, 3000);
  };

  // 渲染课程内容或加载状态
  const renderContent = () => {
    if (loadingCourses) {
      return (
        <RNView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentSubject.color} />
          <Text style={styles.loadingText}>正在加载{currentSubject.name}学科内容...</Text>
        </RNView>
      );
    }

    if (courses.length === 0) {
      return (
        <RNView style={styles.emptyContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={64} color="#ccc" />
          <Text style={styles.emptyText}>暂无{currentSubject.name}学科内容</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentSubject.color }]}
            onPress={() => fetchSubjectCourses(currentSubject.code)}
          >
            <Text style={styles.retryButtonText}>重新加载</Text>
          </TouchableOpacity>
        </RNView>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          handleScroll(e);
          // 滚动时隐藏tooltip
          if (showLockTooltip) {
            setShowLockTooltip(false);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* 课程列表 */}
        {courses.map((course, courseIndex) => {
          let cumulativeHeightInCourse = 0; // Tracks height within the current course for exercise unit positioning
          return (
            <RNView
              key={course.id}
              style={styles.unitContainer}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                bigUnitHeight.current[courseIndex] = height;
              }}
            >
              {/* 普通文字标题 */}
              <RNView style={styles.collapsedHeader}>
                <Text style={styles.collapsedTitle}>
                  第 {courseIndex + 1} 阶段 - {course.title}
                </Text>
              </RNView>

              {/* 课程关卡路径 */}
              <RNView style={styles.levelsPath}>
                {course.levels.map((level: any, index: number) => {
                  const currentLevelProgress = progressData[level.id];
                  let prevLevelFullyUnlocked = false;

                  if (index > 0) {
                    const prevLevelInSection = course.levels[index - 1];
                    if (prevLevelInSection) {
                      const prevLevelProgress = progressData[prevLevelInSection.id];
                      prevLevelFullyUnlocked = prevLevelProgress?.stars >= 3 || prevLevelProgress?.completed === true;
                    }
                  } else if (courseIndex > 0) {
                    const prevCourse = courses[courseIndex - 1];
                    if (prevCourse && prevCourse.levels && prevCourse.levels.length > 0) {
                      const lastLevelOfPrevCourse = prevCourse.levels[prevCourse.levels.length - 1];
                      if (lastLevelOfPrevCourse) {
                        const prevLevelProgress = progressData[lastLevelOfPrevCourse.id];
                        prevLevelFullyUnlocked = prevLevelProgress?.stars >= 3 || prevLevelProgress?.completed === true;
                      }
                    }
                  } else {
                    prevLevelFullyUnlocked = true;
                  }

                  let exerciseTopValue: number | undefined = undefined;
                  if (level.unitType === "exercise") {
                    exerciseTopValue = cumulativeHeightInCourse;
                  } else {
                    // For non-exercise units, update cumulative height for subsequent exercise units
                    const layoutInfo = nonExerciseLevelLayouts[level.id];
                    // Assuming a fixed margin/connector height for non-exercise items for simplicity in accumulation
                    // A more robust solution might involve measuring the whole item including margins
                    const itemHeight = layoutInfo?.height ? layoutInfo.height + 20 /* approx margin/connector */ : FALLBACK_NON_EXERCISE_ITEM_VERTICAL_SPACE;
                    cumulativeHeightInCourse += itemHeight;
                  }

                  return (
                    <Level
                      key={level.id}
                      level={level}
                      color={course.color}
                      isLast={index === course.levels.length - 1}
                      unitTitle={course.title}
                      progress={currentLevelProgress}
                      previousLevelUnlocked={prevLevelFullyUnlocked}
                      courses={courses}
                      currentSubject={currentSubject}
                      progressData={progressData}
                      onShowLockTooltip={handleShowLockTooltip}
                      levelIndex={index}
                      exerciseTop={exerciseTopValue}
                      onNonExerciseLayout={level.unitType !== "exercise" ? handleNonExerciseLayout : undefined}
                    />
                  );
                })}
              </RNView>
            </RNView>
          );
        })}
      </ScrollView>
    );
  };

  // 根据学科代码获取该学科的课程单元数据
  const fetchSubjectCourses = async (subjectCode: string) => {
    setLoadingCourses(true);
    setError(null);

    try {
      // 获取学科的单元数据
      const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectCode}/units`);

      if (!response.ok) {
        throw new Error(`获取${subjectCode}学科单元失败`);
      }

      const result = await response.json();

      if (result.success) {
        // 获取学科信息
        const subjectResponse = await fetch(`${API_BASE_URL}/api/subjects/${subjectCode}`);
        let subject = currentSubject;

        if (subjectResponse.ok) {
          const subjectResult = await subjectResponse.json();
          if (subjectResult.success && subjectResult.data) {
            subject = subjectResult.data;
            // 更新当前学科
            setCurrentSubject(subject);
          }
        }

        // 将API返回的数据转换为应用所需的格式
        const formattedCourses = formatCoursesData(result.data, subject);

        // 确保所有课程都有颜色信息
        const coursesWithColors = ensureCoursesColors(formattedCourses);
        setCourses(coursesWithColors);

        // 获取该学科下的进度数据
        await fetchUserData(coursesWithColors);
      } else {
        setError(`获取${subjectCode}学科单元失败: ${result.message}`);
      }
    } catch (err: any) {
      console.error(`获取学科单元数据出错:`, err);
      setError(`获取学科数据失败: ${err.message}`);
    } finally {
      setLoadingCourses(false);
    }
  };

  return (
    <RNView style={styles.container}>
      {/* 顶部状态栏 */}
      <RNView style={styles.statsBar}>
        <TouchableOpacity style={styles.statItem} onPress={() => setShowSubjectModal(true)}>
          <MaterialCommunityIcons name={currentSubject.iconName as any} size={26} color={currentSubject.color} />
        </TouchableOpacity>

        <RNView style={styles.statItem}>
          <RNView style={styles.streakContainer}>
            <Ionicons name="flame" size={22} color="#FF9600" />
            <Text style={[styles.statText, { color: "#FF9600" }]}>{streak}</Text>
          </RNView>
        </RNView>

        <RNView style={styles.statItem}>
          <RNView style={[styles.gemContainer, { backgroundColor: "#1CB0F6" }]}>
            <FontAwesome5 name="gem" size={14} color="white" solid />
            <Text style={styles.gemText}>{xp}</Text>
          </RNView>
        </RNView>

        <RNView style={styles.statItem}>
          <RNView style={[styles.gemContainer, { backgroundColor: "#FF4B4B" }]}>
            <Ionicons name="heart" size={16} color="white" />
            <Text style={styles.gemText}>{hearts}</Text>
          </RNView>
        </RNView>
      </RNView>

      {/* 学科切换弹窗 */}
      <SubjectModal
        visible={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        onSelectSubject={handleSubjectSelect}
      />

      {/* 锁定提示tooltip - 关卡左侧显示 */}
      {showLockTooltip && (
        <RNView
          style={[
            styles.lockTooltip,
            {
              left: tooltipPosition.x,
              top: tooltipPosition.y - 30, // 垂直居中对齐关卡
            },
          ]}
        >
          <RNView style={styles.tooltipArrowRight} />
          <RNView style={styles.tooltipArrowRightBorder} />
          <Text style={styles.tooltipText}>完成以上全部等级才可以解锁哦!</Text>
        </RNView>
      )}

      {/* 显示错误提示 */}
      {error && (
        <RNView style={styles.errorContainer}>
          <RNView style={styles.errorContent}>
            <Ionicons name="warning" size={20} color="#FF9600" />
            <Text style={styles.errorText}>{error}</Text>
          </RNView>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              // 刷新数据
              fetchSubjectCourses(currentSubject.code);
            }}
          >
            <Text style={styles.refreshButtonText}>重试</Text>
          </TouchableOpacity>
        </RNView>
      )}

      {/* 固定在顶部的 banner */}
      {renderFixedBanner()}

      {/* 课程内容或加载状态 */}
      {renderContent()}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 4,
  },
  gemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  gemText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  unitContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "white",
  },
  unitHeader: {
    padding: 16,
    paddingBottom: 20,
  },
  collapsedHeader: {
    padding: 16,
    backgroundColor: "white",
  },
  collapsedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
  },
  unitTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  unitTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.9,
  },
  unitSubtitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  levelsPath: {
    padding: 24,
    flexDirection: "column",
    alignItems: "center",
    position: 'relative',
  },
  levelContainer: {
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  exerciseLevelContainer: {
    position: "absolute",
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connector: {
    width: 3,
    height: 20,
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  unitEnd: {
    marginTop: 16,
    alignItems: "center",
  },
  chestImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  achievementContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  leagueContainer: {
    width: 70,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  leagueImage: {
    width: 70,
    height: 90,
    resizeMode: "contain",
  },
  leagueText: {
    position: "absolute",
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  achievementText: {
    marginTop: 8,
    fontSize: 18,
    color: "#777",
  },
  fixedBannerContainer: {
    position: "absolute",
    top: 56,
    left: 24,
    right: 24,
    zIndex: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
  },
  levelTitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 150, 0, 0.1)",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    color: "#FF9600",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    backgroundColor: "#FF9600",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#58CC02",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockModalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  lockModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },
  lockModalDescription: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
  },
  lockModalButton: {
    width: "100%",
    padding: 16,
    backgroundColor: "#E5E5E5",
    borderRadius: 8,
    alignItems: "center",
  },
  lockModalButtonText: {
    color: "#999",
    fontSize: 18,
    fontWeight: "600",
  },
  tooltipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "none", // 允许点击穿透
  },
  lockTooltip: {
    position: "absolute",
    width: 180,
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
  },
  tooltipArrowRight: {
    position: "absolute",
    right: -10,
    top: 25,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#F2F2F2",
    zIndex: 2,
  },
  tooltipArrowRightBorder: {
    position: "absolute",
    right: -11,
    top: 24,
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftWidth: 11,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#D0D0D0",
    zIndex: 1,
  },
  tooltipText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
