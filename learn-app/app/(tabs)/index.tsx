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
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getMultipleUnitProgress,
  getCurrentStudentIdForProgress,
  type UnitProgress,
} from "../services/progressService";
import { getStudentPoints } from "../services/pointsService";
import SubjectModal from "@/components/SubjectModal";
import GradeModal from "@/components/GradeModal";
import { useSubject, Subject } from "@/hooks/useSubject";
import { Grade, getUserSubjectGradePreference, setUserPreference } from "../services/gradeService";
import { API_BASE_URL } from "@/constants/apiConfig";
import { CircularProgress } from "@/components/CircularProgress";

// 常量定义
const CURRENT_SUBJECT_KEY = "currentSubject";
const CURRENT_GRADE_KEY = "currentGrade";
const AVERAGE_ITEM_Y_INCREMENT = 120;

/**
 * 保存当前学科到AsyncStorage
 */
const saveCurrentSubject = async (subject: any) => {
  try {
    await AsyncStorage.setItem(CURRENT_SUBJECT_KEY, JSON.stringify(subject));
    console.log("学科已保存:", subject.name);
  } catch (error) {
    console.error("保存学科出错:", error);
  }
};

/**
 * 从AsyncStorage加载学科
 */
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

/**
 * 保存当前年级到AsyncStorage
 */
const saveCurrentGrade = async (grade: Grade) => {
  try {
    await AsyncStorage.setItem(CURRENT_GRADE_KEY, JSON.stringify(grade));
    console.log("年级已保存:", grade.name);
  } catch (error) {
    console.error("保存年级出错:", error);
  }
};

/**
 * 从AsyncStorage加载年级
 */
const loadCurrentGrade = async () => {
  try {
    const savedGrade = await AsyncStorage.getItem(CURRENT_GRADE_KEY);
    if (savedGrade) {
      return JSON.parse(savedGrade);
    }
    return null;
  } catch (error) {
    console.error("加载年级出错:", error);
    return null;
  }
};

/**
 * 清除本地存储的学科和年级信息
 */
const clearLocalPreferences = async () => {
  try {
    await AsyncStorage.multiRemove([CURRENT_SUBJECT_KEY, CURRENT_GRADE_KEY]);
    console.log("✅ 本地学科和年级偏好已清除");
  } catch (error) {
    console.error("清除本地偏好失败:", error);
  }
};

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
  onNonExerciseLayout?: (
    levelId: string,
    layout: { height: number; y: number }
  ) => void;
}) => {
  const router = useRouter();

  // 简化状态判断
  const isExerciseUnit = level.unitType === "exercise";
  const isLocked = isExerciseUnit ? false : previousLevelUnlocked === false;

  // 对于exercise类型单元，需要完成所有题目才算已完成
  // 对于普通单元，学习进度超过50%或掌握程度超过50%就算已完成
  const isCompleted = isExerciseUnit
    ? (progress?.completedExercises || 0) >= (progress?.totalExercises || 1)
    : (progress?.completionRate || 0) > 0.5 ||
      (progress?.masteryLevel || 0) > 0.5;

  // 是否显示掌握度
  const showMasteryIndicator =
    progress?.masteryLevel !== undefined && progress.masteryLevel > 0;

  // 处理关卡点击
  const handleLevelPress = (event: any) => {
    // 对于exercise类型的单元，无需解锁检查，直接跳转到练习页面
    if (isExerciseUnit) {
      // 获取当前单元的完整颜色信息
      const courseId = `unit${Math.floor(levelIndex / 10) + 1}`;
      const course = courses.find((c) => c.id === courseId) || {
        color,
        secondaryColor: color,
      };

      // 使用关卡所属单元的颜色，或默认使用当前学科颜色
      const levelColor = course.color || color;
      const levelSecondaryColor = course.secondaryColor || color;

      // 导航到做题界面（重命名为exercise避免与tabs/practice冲突）
      router.push({
        pathname: "/exercise",
        params: {
          id: level.id,
          unitTitle: `${unitTitle} - ${level.title}`,
          color: levelColor,
          secondaryColor: levelSecondaryColor,
          subject: currentSubject.code,
          isUnlockingTest: "false", // exercise类型单元不是解锁测试
          unlockPreviousUnits: "false", // exercise类型单元不解锁前面的单元
        },
      });
      return;
    }

    // 对于普通单元，检查解锁状态
    if (isLocked) {
      // 显示锁定提示tooltip
      onShowLockTooltip(level.id, event);
      return;
    }

    // 获取当前单元的完整颜色信息
    const courseId = `unit${Math.floor(levelIndex / 10) + 1}`;
    const course = courses.find((c) => c.id === courseId) || {
      color,
      secondaryColor: color,
    };

    // 使用关卡所属单元的颜色，或默认使用当前学科颜色
    const levelColor = course.color || color;
    const levelSecondaryColor = course.secondaryColor || color;

    // 导航到学习页面
    router.push({
      pathname: "/study",
      params: {
        id: level.id,
        unitTitle: `${unitTitle} - ${level.title}`,
        color: levelColor,
        secondaryColor: levelSecondaryColor,
        subject: currentSubject.code,
      },
    });
  };

  // 获取徽章样式
  const getBadgeStyle = () => {
    // exercise类型单元使用特殊的挑战风格
    if (isExerciseUnit) {
      if (isCompleted) {
        return {
          backgroundColor: "#FF6B35", // 挑战完成的橙色
          borderColor: "#FF6B35",
          shadowColor: "#FF6B35",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        };
      } else {
        return {
          backgroundColor: "#FFF3E0", // 浅橙色背景
          borderColor: "#FF6B35",
          borderWidth: 3,
          shadowColor: "#FF6B35",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        };
      }
    }

    // 普通单元的原有样式
    if (isLocked) {
      return {
        backgroundColor: "#E5E5E5",
        borderColor: "#CCCCCC",
      };
    }

    if (isCompleted) {
      return {
        backgroundColor: color,
        borderColor: color,
      };
    }

    return {
      backgroundColor: "white",
      borderColor: color,
      borderWidth: 2,
    };
  };

  // 获取练习单元容器样式
  const getExerciseLevelContainerStyle = () => {
    const style: any = {
      position: "absolute",
      top:
        typeof exerciseTop === "number"
          ? exerciseTop
          : levelIndex * AVERAGE_ITEM_Y_INCREMENT,
      width: 100,
      zIndex: 10,
      alignItems: "center",
    };

    if (level.position === "left") {
      style.left = 5;
    } else if (level.position === "right") {
      style.right = 5;
    } else {
      style.left = 5;
    }
    return style;
  };

  // 获取图标名称
  const getIconName = () => {
    if (isExerciseUnit) {
      return isCompleted ? "trophy" : "crosshairs"; // 挑战风格图标
    }
    return isLocked ? "lock" : isCompleted ? "star" : "play";
  };

  // 获取图标颜色
  const getIconColor = () => {
    if (isExerciseUnit) {
      return isCompleted ? "#FFD700" : "#FF6B35"; // 挑战风格：完成黄色，未完成橙色
    }
    // 普通单元：未解锁灰色，进行中绿色，完全解锁黄色
    return isLocked ? "#AAAAAA" : isCompleted ? "#FFD700" : color;
  };

  return (
    <RNView
      style={[
        isExerciseUnit
          ? getExerciseLevelContainerStyle()
          : styles.levelContainer,
      ]}
      onLayout={(event) => {
        if (!isExerciseUnit && onNonExerciseLayout) {
          const { height, y } = event.nativeEvent.layout;
          onNonExerciseLayout(level.id, { height, y });
        }
      }}
    >
      {/* 环形进度条或挑战指示器 */}
      {!isExerciseUnit ? (
        <TouchableOpacity
          disabled={isLocked}
          onPress={handleLevelPress}
          style={styles.levelProgressButton}
        >
          <CircularProgress
            studyProgress={progress?.completionRate || 0}
            masteryLevel={progress?.masteryLevel || 0}
            color={color}
            size={60}
            iconName={getIconName()}
            iconColor={getIconColor()}
            showCrown={true}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.levelBadge, getBadgeStyle()]}
          disabled={isLocked}
          onPress={handleLevelPress}
        >
          <FontAwesome5 name={getIconName()} size={22} color={getIconColor()} />
        </TouchableOpacity>
      )}

      {/* 关卡标题 */}
      <Text style={styles.levelTitle}>{level.title}</Text>

      {/* 挑战指示器（仅exercise类型显示） */}
      {isExerciseUnit && (
        <RNView style={styles.challengeIndicator}>
          {isCompleted ? (
            <RNView style={styles.challengeCompleted}>
              <FontAwesome5
                name="check-circle"
                size={12}
                color="#FF6B35"
                solid
              />
              <Text style={styles.challengeText}>已完成</Text>
            </RNView>
          ) : (
            <RNView style={styles.challengeReady}>
              <FontAwesome5 name="bolt" size={12} color="#FF6B35" />
              <Text style={styles.challengeText}>挑战</Text>
            </RNView>
          )}
        </RNView>
      )}

      {/* 连接线 */}
      {!isLast && !isExerciseUnit && (
        <RNView
          style={[
            styles.connector,
            {
              backgroundColor: isCompleted ? color : "#E5E5E5",
              width: 3,
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
  const [progressData, setProgressData] = useState<
    Record<string, UnitProgress>
  >({});
  const [error, setError] = useState<string | null>(null);

  // State to store layout information for non-exercise levels
  const [nonExerciseLevelLayouts, setNonExerciseLevelLayouts] = useState<
    Record<string, { height: number; y: number }>
  >({});

  // 从expo-router获取刷新触发参数
  const refreshTrigger = params.refresh as string | undefined;
  const urlSubjectCode = params.currentSubject as string | undefined;

  // 添加学科切换相关状态
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const { currentSubject, setCurrentSubject } = useSubject();

  // 添加年级切换相关状态
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);

  // 添加课程数据状态 - 替代硬编码的COURSES
  const [courses, setCourses] = useState<any[]>([]);

  // 添加加载状态
  const [loadingCourses, setLoadingCourses] = useState(true);

  // 添加tooltip相关状态
  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const bigUnitHeight = useRef<any>([]);

  /**
   * 处理布局信息上报，用于定位练习单元
   */
  const handleNonExerciseLayout = (
    levelId: string,
    layout: { height: number; y: number }
  ) => {
    setNonExerciseLevelLayouts((prev) => {
      // 只在布局发生变化时更新，避免不必要的重渲染
      if (
        prev[levelId]?.height !== layout.height ||
        prev[levelId]?.y !== layout.y
      ) {
        return { ...prev, [levelId]: layout };
      }
      return prev;
    });
  };

  /**
   * 确保课程数据有正确的颜色信息
   */
  const ensureCoursesColors = (coursesData: any[]): any[] => {
    return coursesData.map((course) => {
      if (!course) return course;

      // 确保主色存在，否则使用默认颜色
      const primaryColor = course.color || currentSubject.color || "#58CC02";
      // 确保次要色存在，否则基于主色生成
      const secondaryColor =
        course.secondaryColor || getLighterColor(primaryColor);

      return {
        ...course,
        color: primaryColor,
        secondaryColor: secondaryColor,
      };
    });
  };

  // 组件挂载后初始化位置数据和加载默认学科课程
  useEffect(() => {
    // 尝试加载保存的学科和年级
    const initApp = async () => {
      try {
        let subject;
        let grade;
        
        // 1. 优先从本地存储加载学科和年级
        const [savedSubject, savedGrade] = await Promise.all([
          loadCurrentSubject(),
          loadCurrentGrade()
        ]);

        if (savedSubject) {
          console.log("从本地存储加载学科:", savedSubject.name);
          subject = savedSubject;
          setCurrentSubject(subject);
        } else {
          // 从服务器获取默认学科(数学)
          const response = await fetch(`${API_BASE_URL}/api/subjects/math`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              console.log("从服务器加载默认学科:", result.data.name);
              subject = result.data;
              setCurrentSubject(subject);
              // 保存到本地
              await saveCurrentSubject(subject);
            }
          }
        }

        if (savedGrade) {
          console.log("从本地存储加载年级:", savedGrade.name);
          grade = savedGrade;
          setCurrentGrade(grade);
        }

        // 2. 如果有学科和年级，直接加载课程数据
        if (subject && grade) {
          console.log("✅ 学科和年级都已加载，开始获取课程数据");
          await fetchSubjectCourses(subject.code, grade);
          return;
        }

        // 3. 如果有学科但没有年级，尝试从服务器加载年级偏好
        if (subject && !grade) {
          const loadedGrade = await loadUserGradePreference(subject.code);
          
          if (loadedGrade) {
            // 有年级偏好，直接获取数据（传递加载的年级避免状态更新延迟）
            await fetchSubjectCourses(subject.code, loadedGrade);
          } else {
            // 没有年级偏好，提示用户选择年级
            Alert.alert(
              "请选择年级", 
              `欢迎学习${subject.name}，请先选择您的年级`,
              [
                {
                  text: "选择年级",
                  style: "default",
                  onPress: () => {
                    setShowGradeModal(true);
                  },
                },
              ]
            );
          }
        } else if (!subject) {
          // 如果连学科都没有，使用默认值
          console.warn("⚠️ 无法加载学科，使用默认值");
          fetchSubjectCourses("math");
        }
      } catch (error) {
        console.error("初始化应用失败:", error);
        // 出错时使用默认值
        fetchSubjectCourses("math");
      }
    };

    initApp();
  }, []);

  // 加载用户年级偏好
  const loadUserGradePreference = async (subjectCode: string): Promise<Grade | null> => {
    try {
      const currentStudentIdStr = await getCurrentStudentIdForProgress();
      const currentStudentId = parseInt(currentStudentIdStr);
      
      const preference = await getUserSubjectGradePreference(currentStudentId, subjectCode);
      
      if (preference && preference.grade) {
        setCurrentGrade(preference.grade);
        // 同时保存到本地存储
        await saveCurrentGrade(preference.grade);
        console.log("加载用户年级偏好:", preference.grade.name);
        return preference.grade;
      }
      return null;
    } catch (error) {
      console.error("加载用户年级偏好失败:", error);
      return null;
    }
  };

  // 格式化API数据为前端所需格式
  const formatCoursesData = (apiData: any, subject: any) => {
    console.log("🔄 开始格式化数据");
    console.log("📥 输入参数:", { apiData, subject, currentGrade });
    
    // 验证参数
    if (!apiData || !subject) {
      console.error("❌ 格式化课程数据参数无效：", { apiData, subject });
      return [];
    }

    const resultData = apiData.data || apiData;
    if (!Array.isArray(resultData)) {
      console.error("❌ API数据格式无效：", { resultData });
      return [];
    }

    let unitsData = [];

    // 检查数据结构，判断是否按年级分组
    if (resultData.length > 0 && resultData[0].grade && resultData[0].units) {
      // 按年级分组的数据结构（没有传递年级参数时）
      console.log("🏫 检测到按年级分组的数据结构");
      
      // 如果有当前年级，只使用该年级的数据
      if (currentGrade) {
        console.log(`🔍 查找年级 ${currentGrade.id} 的数据`);
        const gradeData = resultData.find(item => item.grade.id === currentGrade.id);
        if (gradeData) {
          unitsData = gradeData.units || [];
          console.log(`✅ 找到年级 ${currentGrade.id} 的数据:`, unitsData);
        } else {
          console.warn(`⚠️ 未找到年级 ${currentGrade.id} 的数据`);
          unitsData = [];
        }
      } else {
        // 如果没有选择年级，使用第一个年级的数据
        console.warn("⚠️ 未选择年级，使用第一个年级的数据");
        unitsData = resultData[0]?.units || [];
      }
    } else {
      // 直接的单元数组（传递了年级参数时）
      console.log("📚 检测到直接的单元数组结构");
      unitsData = resultData;
      console.log("📚 单元数据:", unitsData);
    }

    if (!Array.isArray(unitsData)) {
      console.error("❌ 单元数据格式无效：", { unitsData });
      return [];
    }

    console.log(`📊 准备格式化 ${unitsData.length} 个单元`);

    // 直接使用API返回的结构化数据，转换为前端格式
    const formattedCourses = unitsData.map((unit: any, index: number) => {
      console.log(`🔄 格式化单元 ${index + 1}:`, unit.title);
      
      // 使用大单元的颜色
      const unitColor = unit.color || subject.color;
      const unitSecondaryColor =
        unit.secondaryColor || getLighterColor(unitColor);

      const formattedUnit = {
        id: `unit${index + 1}`,
        title: unit.title,
        description: unit.description || `学习${subject.name}基础知识`,
        color: unitColor,
        secondaryColor: unitSecondaryColor,
        // 将小单元作为关卡
        levels: (unit.courses || []).map((course: any) => {
          return {
            id: course.id, // 使用原始ID
            title: course.title,
            unitType: course.unitType || "normal",
            position: course.position || "default",
          };
        }),
      };
      
      console.log(`✅ 单元 ${index + 1} 格式化完成:`, formattedUnit);
      return formattedUnit;
    });

    console.log(`🎉 所有单元格式化完成，共 ${formattedCourses.length} 个`);
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
    return `#${lighterR.toString(16).padStart(2, "0")}${lighterG
      .toString(16)
      .padStart(2, "0")}${lighterB.toString(16).padStart(2, "0")}`;
  };

  // 监听滚动
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const height = bigUnitHeight.current.reduce(
      (result: any, current: any, index: any) => {
        if (index === 0) {
          return [current];
        } else {
          return [...result, result[result.length - 1] + current];
        }
      },
      []
    );
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
  const handleSubjectSelect = async (subject: Subject) => {
    // 关闭模态框
    setShowSubjectModal(false);

    // 如果选择的是当前学科，不做任何操作
    if (subject.code === currentSubject.code) {
      return;
    }

    // 保存学科到上下文和AsyncStorage
    saveCurrentSubject(subject);

    try {
      // 获取当前学生ID
      const currentStudentIdStr = await getCurrentStudentIdForProgress();
      const currentStudentId = parseInt(currentStudentIdStr);
      
      // 检查用户是否有该学科的年级偏好
      const preference = await getUserSubjectGradePreference(currentStudentId, subject.code);
      
      if (preference && preference.gradeId && preference.grade) {
        // 如果有年级偏好，直接切换到该年级
        setCurrentGrade(preference.grade);
        
        // 弹出提示并刷新
        Alert.alert("学科已切换", `您已成功切换到${subject.name}学科，年级：${preference.grade.name}`, [
          {
            text: "好的",
            style: "default",
            onPress: () => {
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
      } else {
        // 如果没有年级偏好，需要用户选择年级
        Alert.alert(
          "请选择年级", 
          `您已切换到${subject.name}学科，请选择要学习的年级`,
          [
            {
              text: "选择年级",
              style: "default",
              onPress: () => {
                setShowGradeModal(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("获取用户年级偏好失败:", error);
      // 如果获取偏好失败，也让用户选择年级
      Alert.alert(
        "请选择年级", 
        `您已切换到${subject.name}学科，请选择要学习的年级`,
        [
          {
            text: "选择年级",
            style: "default",
            onPress: () => {
              setShowGradeModal(true);
            },
          },
        ]
      );
    }

    // 更新本地状态
    setCurrentSubject(subject);
    // 保存学科到本地存储
    await saveCurrentSubject(subject);
    setError(null);
    setProgressData({});
    setCurrentUnit(0);
    setCourses([]); // 清空当前课程数据
    setLoadingCourses(true); // 显示加载状态
  };

  // 处理年级切换
  const handleGradeSelect = async (grade: Grade) => {
    console.log("🎯 开始年级切换:", grade);
    console.log("🔍 当前年级状态:", currentGrade);
    
    // 如果选择的是当前年级，仍然需要关闭模态框并确保状态正确
    if (currentGrade && grade.id === currentGrade.id) {
      console.log("⚠️ 选择的是当前年级，关闭模态框");
      setShowGradeModal(false);
      return;
    }

    try {
      // 先更新UI状态
      setShowGradeModal(false);
      setLoadingCourses(true);
      setError(null);
      
      // 立即更新当前年级状态（同步更新）
      setCurrentGrade(grade);
      console.log("✅ 年级状态已更新到:", grade.name);
      
      // 同时保存到本地存储
      await saveCurrentGrade(grade);
      console.log("✅ 年级偏好保存到本地成功");

      // 获取当前学生ID并保存到服务器
      const currentStudentIdStr = await getCurrentStudentIdForProgress();
      const currentStudentId = parseInt(currentStudentIdStr);
      
      // 保存用户的年级-学科偏好到服务器
      await setUserPreference(currentStudentId, currentSubject.code, grade.id);
      console.log("✅ 年级偏好保存到服务器成功");
      
      // 清空当前数据，准备加载新年级的数据
      setProgressData({});
      setCurrentUnit(0);
      setCourses([]);

      // 立即刷新当前学科的课程数据（传递年级参数以避免状态更新延迟）
      console.log("🔄 开始加载新年级的数据");
      await fetchSubjectCourses(currentSubject.code, grade);
      
      // 弹出成功提示
      Alert.alert("年级已切换", `您已成功切换到${grade.name}，正在加载新的学习内容...`);
      
    } catch (error) {
      console.error("❌ 设置用户年级偏好失败:", error);
      // 如果出错，恢复之前的状态
      setLoadingCourses(false);
      // 显示具体的错误信息
      const errorMessage = error instanceof Error ? error.message : "年级切换失败，请重试";
      Alert.alert("切换失败", errorMessage);
    }
  };

  // 分阶段获取用户进度数据和积分
  const fetchUserData = async (coursesData = courses) => {
    if (coursesData.length === 0) return;

    setError(null);

    try {
      // 立即异步获取积分数据
              getStudentPoints()
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
  const fetchProgressByStage = async (
    stageIndex: number,
    coursesData = courses
  ) => {
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
          const response = await fetch(
            `${API_BASE_URL}/api/subjects/${urlSubjectCode}`
          );
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
    const secondaryColor =
      course.secondaryColor || getLighterColor(primaryColor);

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
          <Text style={styles.loadingText}>
            正在加载{currentSubject.name}学科内容...
          </Text>
        </RNView>
      );
    }

    if (courses.length === 0) {
      return (
        <RNView style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyText}>
            暂无{currentSubject.name}学科内容
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: currentSubject.color },
            ]}
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
          if (showLockTooltip) {
            setShowLockTooltip(false);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* 课程列表 */}
        {courses.map((course, courseIndex) => {
          let cumulativeHeightInCourse = 0; // 记录当前课程中累积高度，用于练习单元定位

          return (
            <RNView
              key={course.id}
              style={styles.unitContainer}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                bigUnitHeight.current[courseIndex] = height;
              }}
            >
              {/* 大单元标题 */}
              <RNView style={styles.collapsedHeader}>
                <RNView style={styles.unitTitleWithIcon}>
                  <FontAwesome5
                    name="bookmark"
                    size={18}
                    color={course.color}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[styles.collapsedTitle, { color: course.color }]}
                  >
                    {course.title}
                  </Text>
                </RNView>
                <Text style={styles.collapsedSubtitle}>
                  第 {courseIndex + 1} 阶段
                </Text>
              </RNView>

              {/* 课程关卡路径 */}
              <RNView style={styles.levelsPath}>
                {course.levels.map((level: any, index: number) => {
                  // 获取当前级别进度
                  const currentLevelProgress = progressData[level.id];

                  // 解锁逻辑：第一个小单元总是解锁的，其他小单元需要前一个完成
                  let prevLevelFullyUnlocked = index === 0;

                  if (!prevLevelFullyUnlocked && index > 0) {
                    // 检查同一大单元中的前一个小单元
                    // 需要跳过exercise类型的单元，找到前一个normal类型的单元
                    let prevNormalLevelIndex = index - 1;
                    let prevLevelInSection =
                      course.levels[prevNormalLevelIndex];

                    // 向前查找最近的normal类型单元
                    while (
                      prevNormalLevelIndex >= 0 &&
                      prevLevelInSection?.unitType === "exercise"
                    ) {
                      prevNormalLevelIndex--;
                      prevLevelInSection = course.levels[prevNormalLevelIndex];
                    }

                    if (
                      prevLevelInSection &&
                      prevLevelInSection.unitType === "normal"
                    ) {
                      const prevLevelProgress =
                        progressData[prevLevelInSection.id];
                      prevLevelFullyUnlocked =
                        (prevLevelProgress?.completionRate || 0) >= 0.8 ||
                        (prevLevelProgress?.masteryLevel || 0) >= 0.8 ||
                        prevLevelProgress?.completed === true;
                    } else {
                      // 如果没有找到前面的normal类型单元，则认为已解锁
                      prevLevelFullyUnlocked = true;
                    }
                  } else if (
                    !prevLevelFullyUnlocked &&
                    courseIndex > 0 &&
                    index === 0
                  ) {
                    // 检查前一个大单元的最后一个小单元
                    const prevCourse = courses[courseIndex - 1];
                    if (prevCourse?.levels?.length > 0) {
                      // 找到前一个大单元中最后一个normal类型的单元
                      let lastNormalLevelIndex = prevCourse.levels.length - 1;
                      let lastLevelOfPrevCourse =
                        prevCourse.levels[lastNormalLevelIndex];

                      // 向前查找最后一个normal类型单元
                      while (
                        lastNormalLevelIndex >= 0 &&
                        lastLevelOfPrevCourse?.unitType === "exercise"
                      ) {
                        lastNormalLevelIndex--;
                        lastLevelOfPrevCourse =
                          prevCourse.levels[lastNormalLevelIndex];
                      }

                      if (
                        lastLevelOfPrevCourse &&
                        lastLevelOfPrevCourse.unitType === "normal"
                      ) {
                        const prevLevelProgress =
                          progressData[lastLevelOfPrevCourse.id];
                        prevLevelFullyUnlocked =
                          (prevLevelProgress?.completionRate || 0) >= 0.8 ||
                          (prevLevelProgress?.masteryLevel || 0) >= 0.8 ||
                          prevLevelProgress?.completed === true;
                      } else {
                        // 如果前一个大单元没有normal类型的单元，则认为已解锁
                        prevLevelFullyUnlocked = true;
                      }
                    }
                  }

                  // 计算练习单元的垂直位置
                  let exerciseTopValue = undefined;
                  if (level.unitType === "exercise") {
                    exerciseTopValue = cumulativeHeightInCourse;
                  } else {
                    // 更新累积高度
                    const layoutInfo = nonExerciseLevelLayouts[level.id];
                    const itemHeight = layoutInfo?.height
                      ? layoutInfo.height + 20
                      : AVERAGE_ITEM_Y_INCREMENT;
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
                      onNonExerciseLayout={
                        level.unitType !== "exercise"
                          ? handleNonExerciseLayout
                          : undefined
                      }
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

  // 根据学科代码获取该学科的课程单元数据 - 必须有年级
  const fetchSubjectCourses = async (subjectCode: string, grade?: Grade) => {
    setLoadingCourses(true);
    setError(null);

    try {
      // 使用传入的年级参数或当前年级状态
      const targetGrade = grade || currentGrade;
      
      // 必须有年级才能获取单元数据
      if (!targetGrade) {
        console.warn("⚠️ 尝试获取课程数据时没有年级信息");
        setError("请先选择年级");
        setLoadingCourses(false);
        return;
      }

      console.log("🔄 开始获取课程数据:", { subjectCode, gradeId: targetGrade.id, gradeName: targetGrade.name });

      // 构建API URL
      const apiUrl = `${API_BASE_URL}/api/subjects/${subjectCode}/${targetGrade.id}/units`;

      // 获取学科的单元数据
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`获取${subjectCode}学科单元失败`);
      }

      const result = await response.json();

      if (result.success) {
        console.log("🔍 API返回数据:", JSON.stringify(result, null, 2));
        console.log("🎯 当前年级:", currentGrade);
        
        // 获取学科信息
        const subjectResponse = await fetch(
          `${API_BASE_URL}/api/subjects/${subjectCode}`
        );
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
        const formattedCourses = formatCoursesData(result, subject);
        console.log("📝 格式化后的课程数据:", formattedCourses);

        // 确保所有课程都有颜色信息
        const coursesWithColors = ensureCoursesColors(formattedCourses);
        console.log("🎨 添加颜色后的课程数据:", coursesWithColors);
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
        <RNView style={styles.switchContainer}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setShowSubjectModal(true)}
          >
            <MaterialCommunityIcons
              name={currentSubject.iconName as any}
              size={24}
              color={currentSubject.color}
            />
            <Text 
              style={[styles.switchLabel, { color: currentSubject.color }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentSubject ? currentSubject.name : '学科'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setShowGradeModal(true)}
          >
            <MaterialCommunityIcons
              name="school"
              size={24}
              color={currentSubject.color}
            />
            <Text style={[styles.switchLabel, { color: currentSubject.color }]}>
              {currentGrade ? currentGrade.name : '年级'}
            </Text>
          </TouchableOpacity>
        </RNView>

        <RNView style={styles.statItem}>
          <RNView style={styles.streakContainer}>
            <Ionicons name="flame" size={22} color="#FF9600" />
            <Text style={[styles.statText, { color: "#FF9600" }]}>
              {streak}
            </Text>
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

      {/* 年级切换弹窗 */}
      <GradeModal
        visible={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        onSelectGrade={handleGradeSelect}
        currentSubjectCode={currentSubject.code}
        currentGrade={currentGrade}
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
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
    paddingBottom: 40,
  },
  unitContainer: {
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
    marginBottom: 16,
    marginHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  collapsedTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  collapsedSubtitle: {
    fontSize: 14,
    color: "#666",
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
    position: "relative",
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
  levelProgressButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    width: 3,
    height: 20,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
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
    top: 70,
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
  unitTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  masteryContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  challengeIndicator: {
    marginTop: 8,
    alignItems: "center",
  },
  challengeCompleted: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderWidth: 1,
    borderColor: "#FF6B35",
    borderRadius: 8,
  },
  challengeReady: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderWidth: 1,
    borderColor: "#FF6B35",
    borderRadius: 8,
  },
  challengeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B35",
  },
});

