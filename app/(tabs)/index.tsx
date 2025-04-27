import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, ScrollView, Image, TouchableOpacity, View as RNView, Animated, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Alert } from "react-native";
import { Text, View } from "../../components/Themed";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
// 暂时注释掉进度服务导入，先解决错误
// import { getUserUnitProgress, getMultipleUnitProgress } from "../services/progressService";

// 单元数据 - 每个单元都有独特的主题色
const COURSES = [
  {
    id: "unit1",
    title: "代数基础",
    description: "掌握一元二次方程和函数基础",
    icon: "https://i.imgur.com/QgQQXTI.png",
    color: "#58CC02",
    secondaryColor: "#89E219",
    levels: [
      { id: "1-1", title: "一元二次方程解法", type: "normal" },
      { id: "1-2", title: "因式分解", type: "normal" },
      { id: "1-3", title: "配方法", type: "normal" },
      { id: "1-4", title: "公式法", type: "normal" },
      { id: "1-5", title: "函数图像", type: "normal" },
      { id: "1-6", title: "二次函数应用", type: "challenge" },
    ],
  },
  {
    id: "unit2",
    title: "几何与证明",
    description: "学习三角形、四边形的性质与证明",
    icon: "https://i.imgur.com/vAMCb0f.png",
    color: "#5EC0DE",
    secondaryColor: "#7BDAF8",
    levels: [
      { id: "2-1", title: "相似三角形", type: "normal" },
      { id: "2-2", title: "勾股定理", type: "normal" },
      { id: "2-3", title: "平行四边形", type: "normal" },
      { id: "2-4", title: "圆的性质", type: "challenge" },
    ],
  },
  {
    id: "unit3",
    title: "统计与概率",
    description: "掌握数据分析与概率计算方法",
    icon: "https://i.imgur.com/yjcbqsP.png",
    color: "#FF9600",
    secondaryColor: "#FFC566",
    levels: [
      { id: "3-1", title: "数据统计基础", type: "normal" },
      { id: "3-2", title: "概率基础", type: "normal" },
      { id: "3-3", title: "复杂概率问题", type: "challenge" },
    ],
  },
];

// 关卡组件
const Level = ({ level, color, isLast, unitTitle, progress, previousLevelUnlocked }: {
  level: any;
  color: string;
  isLast: boolean;
  unitTitle: string;
  progress?: any;
  previousLevelUnlocked?: boolean;
}) => {
  const router = useRouter();

  // 计算关卡是否锁定
  // 第一个关卡默认解锁，其他关卡需要前一个关卡达到3星才解锁
  const isLocked = previousLevelUnlocked === false;

  // 获取星星数量
  const stars = progress?.stars || 0;

  // 处理关卡点击
  const handleLevelPress = () => {
    if (isLocked) {
      Alert.alert(
        "关卡未解锁",
        "请先完成前一个关卡的所有练习题，获得3颗星才能解锁此关卡。"
      );
      return;
    }

    // 导航到学习页面（独立页面，不是tab）
    router.push({
      pathname: "/study",
      params: {
        id: level.id,
        unitTitle: `${unitTitle} - ${level.title}`,
        color: color
      }
    });
  };

  // 计算完成状态
  const isCompleted = stars > 0;

  // 根据类型和状态选择样式
  const getBadgeStyle = () => {
    if (isLocked) {
      return {
        backgroundColor: "#E5E5E5",
        borderColor: "#CCCCCC",
      };
    }

    if (level.type === "challenge") {
      return {
        backgroundColor: isCompleted ? "#FFD900" : "#FFC800",
        borderColor: "#E6B800",
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

  const getIconName = () => {
    if (isLocked) {
      return "lock";
    }
    if (level.type === "challenge") {
      return "crown";
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
    if (level.type === "challenge") {
      return "white";
    }
    if (isCompleted) {
      return "white";
    }
    return color;
  };

  return (
    <RNView style={styles.levelContainer}>
      <TouchableOpacity
        style={[styles.levelBadge, getBadgeStyle()]}
        disabled={level.locked}
        onPress={handleLevelPress}
      >
        <FontAwesome5 name={getIconName()} size={22} color={getIconColor()} />
      </TouchableOpacity>

      {/* 关卡标题 */}
      <Text style={styles.levelTitle}>{level.title}</Text>

      {/* 星星评分 */}
      <RNView style={styles.starsContainer}>
        {[...Array(3)].map((_, i) => (
          <FontAwesome5
            key={i}
            name="star"
            size={10}
            solid={i < stars}
            color={i < stars ? "#FFD900" : "#E0E0E0"}
            style={{ marginHorizontal: 1 }}
          />
        ))}
      </RNView>

      {/* 连接线 */}
      {!isLast && (
        <RNView
          style={[
            styles.connector,
            {
              backgroundColor: isCompleted ? color : "#E5E5E5"
            }
          ]}
        />
      )}
    </RNView>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [currentUnit, setCurrentUnit] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(1175);
  const [hearts, setHearts] = useState(5);
  const scrollY = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<Record<string, any>>({});

  // 使用固定高度计算位置（因为直接获取的layout.y值不准确）
  const UNIT_HEIGHTS = [750, 450, 450]; // 增加每个单元的高度估计值
  const unitPositions = useRef<number[]>([]);
  const lastScrollPosition = useRef(0);

  // 组件挂载后初始化位置数据
  React.useEffect(() => {
    // 计算每个单元的绝对位置
    let currentPosition = 60; // 设置起始偏移量，考虑顶部状态栏
    const positions = [];

    for (let i = 0; i < COURSES.length; i++) {
      positions.push(currentPosition);
      currentPosition += UNIT_HEIGHTS[i];
    }

    unitPositions.current = positions;
    console.log('初始化单元位置:', positions);
  }, []);

  // 获取用户进度数据
  useEffect(() => {
    const fetchUserProgress = async () => {
      setLoading(true);
      try {
        // 暂时使用模拟数据
        const mockProgressData: Record<string, any> = {};

        // 为每个关卡创建模拟进度数据
        COURSES.forEach(course => {
          course.levels.forEach((level, index) => {
            // 第一个关卡完成度高，其他递减
            let stars = 0;
            if (index === 0) {
              stars = 3; // 第一个关卡3星
            } else if (index === 1) {
              stars = 2; // 第二个关卡2星
            } else if (index === 2) {
              stars = 1; // 第三个关卡1星
            }

            mockProgressData[level.id] = {
              unitId: level.id,
              totalExercises: 10,
              completedExercises: stars * 3,
              completionRate: stars * 0.3,
              stars: stars,
              unlockNext: stars === 3
            };
          });
        });

        setProgressData(mockProgressData);
      } catch (error) {
        console.error('获取用户进度出错:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  // 监听滚动
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingDown = currentScrollY > lastScrollPosition.current;
    lastScrollPosition.current = currentScrollY;

    // 滚动到顶部显示第一个单元
    if (currentScrollY <= 0) {
      setCurrentUnit(0);
      return;
    }

    // 确保有位置数据
    if (unitPositions.current.length < COURSES.length) {
      return;
    }

    // 触发点在屏幕上方一半的位置
    const triggerY = screenHeight * 0.25;

    console.log(`屏幕高度: ${screenHeight}, 触发点位置: ${triggerY}`);

    // 简化逻辑：只关注当前单元和相邻单元的位置
    // 向下滚动时
    if (isScrollingDown) {
      // 检查下一个单元（如果有）
      if (currentUnit < COURSES.length - 1) {
        const nextUnitPos = unitPositions.current[currentUnit + 1] - currentScrollY;
        console.log(`下一个单元${currentUnit + 1}位置: ${nextUnitPos}, 触发点: ${triggerY}`);

        // 当下一个单元的标题位置低于触发点时，切换到下一个单元
        if (nextUnitPos <= triggerY) {
          console.log(`切换到单元${currentUnit + 1}`);
          setCurrentUnit(currentUnit + 1);
        }
      }
    }
    // 向上滚动时
    else {
      // 检查当前单元
      const currentUnitPos = unitPositions.current[currentUnit] - currentScrollY;
      console.log(`当前单元${currentUnit}位置: ${currentUnitPos}, 触发点: ${triggerY}`);

      // 当当前单元的标题位置高于触发点时，如果有上一个单元，切换到上一个单元
      if (currentUnitPos > triggerY && currentUnit > 0) {
        console.log(`切换到单元${currentUnit - 1}`);
        setCurrentUnit(currentUnit - 1);
      }
    }
  };

  const renderFixedBanner = () => {
    if (currentUnit === -1) return null;
    const course = COURSES[currentUnit];

    return (
      <RNView style={styles.fixedBannerContainer}>
        <LinearGradient
          colors={[course.color, course.secondaryColor]}
          style={styles.unitHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <RNView style={styles.unitTitleRow}>
            <Text style={styles.unitTitle}>第 {currentUnit + 1} 阶段，第 1 部分</Text>
          </RNView>
          <Text style={styles.unitSubtitle}>{course.title}</Text>
        </LinearGradient>
      </RNView>
    );
  };

  return (
    <RNView style={styles.container}>
      {/* 顶部状态栏 */}
      <RNView style={styles.statsBar}>
        <TouchableOpacity style={styles.statItem}>
          <MaterialCommunityIcons name="calculator-variant" size={26} color="#1CB0F6" />
        </TouchableOpacity>

        <RNView style={styles.statItem}>
          <RNView style={styles.streakContainer}>
            <Ionicons name="flame" size={22} color="#FF9600" />
            <Text style={[styles.statText, { color: '#FF9600' }]}>{streak}</Text>
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

      {/* 固定在顶部的 banner */}
      {renderFixedBanner()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 课程列表 */}
        {COURSES.map((course, courseIndex) => (
          <RNView key={course.id} style={styles.unitContainer}>
            {/* 普通文字标题 */}
            <RNView
              style={styles.collapsedHeader}
              onLayout={(event) => {
                // 记录实际位置以便调试比较
                const layout = event.nativeEvent.layout;
                console.log(`单元${courseIndex}实际位置: y=${layout.y}`);
              }}
            >
              <Text style={styles.collapsedTitle}>
                第 {courseIndex + 1} 阶段 - {course.title}
              </Text>
            </RNView>

            {/* 课程关卡路径 */}
            <RNView style={styles.levelsPath}>
              {course.levels.map((level, index) => {
                // 获取当前关卡的进度数据
                const levelProgress = progressData[level.id];

                // 获取前一个关卡的解锁状态
                // 第一个关卡默认解锁，其他关卡需要前一个关卡达到3星才解锁
                let previousLevelUnlocked = index === 0;
                if (index > 0) {
                  const prevLevelId = course.levels[index - 1].id;
                  const prevLevelProgress = progressData[prevLevelId];
                  previousLevelUnlocked = prevLevelProgress?.stars === 3;
                }

                return (
                  <Level
                    key={level.id}
                    level={level}
                    color={course.color}
                    isLast={index === course.levels.length - 1}
                    unitTitle={course.title}
                    progress={levelProgress}
                    previousLevelUnlocked={previousLevelUnlocked}
                  />
                );
              })}

              {/* 单元底部的宝箱图标 */}
              {courseIndex === 0 && (
                <RNView style={styles.unitEnd}>
                  <Image
                    source={{ uri: 'https://i.imgur.com/h3pFJG3.png' }}
                    style={styles.chestImage}
                  />
                </RNView>
              )}
            </RNView>

            {/* 界面底部的成就托盘 */}
            {courseIndex === COURSES.length - 1 && (
              <RNView style={styles.achievementContainer}>
                <RNView style={styles.leagueContainer}>
                  <Image
                    source={{ uri: 'https://i.imgur.com/NhBFjc6.png' }}
                    style={styles.leagueImage}
                  />
                  <Text style={styles.leagueText}>1</Text>
                </RNView>
                <Text style={styles.achievementText}>培养数感</Text>
              </RNView>
            )}
          </RNView>
        ))}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 4,
  },
  gemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  gemText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
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
    backgroundColor: 'white',
  },
  unitHeader: {
    padding: 16,
    paddingBottom: 20,
  },
  collapsedHeader: {
    padding: 16,
    backgroundColor: 'white',
  },
  collapsedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  unitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  unitTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
  unitSubtitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelsPath: {
    padding: 24,
    flexDirection: 'column',
    alignItems: 'center',
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
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
    flexDirection: 'row',
    marginTop: 4,
  },
  unitEnd: {
    marginTop: 16,
    alignItems: 'center',
  },
  chestImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  achievementContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  leagueContainer: {
    width: 70,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueImage: {
    width: 70,
    height: 90,
    resizeMode: 'contain',
  },
  leagueText: {
    position: 'absolute',
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  achievementText: {
    marginTop: 8,
    fontSize: 18,
    color: '#777',
  },
  fixedBannerContainer: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    zIndex: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
  },
  levelTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
