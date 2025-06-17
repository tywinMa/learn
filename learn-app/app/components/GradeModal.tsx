import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Text, View } from "./Themed";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { getSubjectAvailableGrades, Grade } from "../services/gradeService";

interface GradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGrade: (grade: Grade) => void;
  currentSubjectCode: string;
  currentGrade?: Grade | null;
}

const GradeModal = ({ visible, onClose, onSelectGrade, currentSubjectCode, currentGrade }: GradeModalProps) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 学段颜色映射
  const LEVEL_COLORS = {
    primary: '#58CC02', // 绿色 - 小学
    middle: '#1CB0F6',  // 蓝色 - 初中
    high: '#FF4B4B'     // 红色 - 高中
  };

  const LEVEL_NAMES = {
    primary: '小学',
    middle: '初中',
    high: '高中'
  };

  // 获取年级列表
  useEffect(() => {
    if (visible && currentSubjectCode) {
      fetchGrades();
    }
  }, [visible, currentSubjectCode]);

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSubjectAvailableGrades(currentSubjectCode);
      setGrades(data);
    } catch (err: any) {
      console.error("获取年级列表出错:", err);
      setError(err.message || "获取年级列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 渲染年级项
  const renderGradeItem = ({ item }: { item: Grade }) => {
    const isSelected = currentGrade?.id === item.id;
    const levelColor = LEVEL_COLORS[item.level as keyof typeof LEVEL_COLORS];

    // 添加调试信息
    console.log(`🔍 年级项渲染 - ${item.name}:`, {
      itemId: item.id,
      currentGradeId: currentGrade?.id,
      isSelected
    });

    return (
      <TouchableOpacity
        style={[
          styles.gradeItem, 
          isSelected && { 
            borderColor: levelColor, 
            backgroundColor: `${levelColor}10` 
          }
        ]}
        onPress={() => {
          console.log(`🎯 点击了年级: ${item.name} (ID: ${item.id})`);
          onSelectGrade(item);
        }}
      >
        <RNView style={[styles.iconContainer, { backgroundColor: levelColor }]}>
          <MaterialCommunityIcons 
            name="school" 
            size={24} 
            color="white" 
          />
        </RNView>

        <RNView style={styles.gradeInfo}>
          <Text style={styles.gradeName}>{item.name}</Text>
          <Text style={styles.gradeDescription} numberOfLines={1}>
            {LEVEL_NAMES[item.level as keyof typeof LEVEL_NAMES]} • {item.description || `${item.name}学习内容`}
          </Text>
        </RNView>

        {isSelected && (
          <RNView style={[styles.selectedIndicator, { backgroundColor: levelColor }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </RNView>
        )}
      </TouchableOpacity>
    );
  };

  // 按学段分组年级
  const groupGradesByLevel = (grades: Grade[]) => {
    const grouped = grades.reduce((acc, grade) => {
      if (!acc[grade.level]) {
        acc[grade.level] = [];
      }
      acc[grade.level].push(grade);
      return acc;
    }, {} as Record<string, Grade[]>);

    // 按学段顺序返回分组数据
    const orderedLevels: (keyof typeof LEVEL_NAMES)[] = ['primary', 'middle', 'high'];
    return orderedLevels
      .filter(level => grouped[level] && grouped[level].length > 0)
      .map(level => ({
        level,
        name: LEVEL_NAMES[level],
        color: LEVEL_COLORS[level],
        grades: grouped[level].sort((a: Grade, b: Grade) => a.order - b.order)
      }));
  };

  const renderLevelSection = ({ item }: { item: { level: string, name: string, color: string, grades: Grade[] } }) => (
    <RNView style={styles.levelSection}>
      <RNView style={styles.levelHeader}>
        <RNView style={[styles.levelIndicator, { backgroundColor: item.color }]} />
        <Text style={styles.levelTitle}>{item.name}</Text>
      </RNView>
      {item.grades.map((grade) => renderGradeItem({ item: grade }))}
    </RNView>
  );

  const groupedGrades = groupGradesByLevel(grades);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <RNView style={styles.modalOverlay}>
        <BlurView intensity={50} style={styles.blurContainer} tint="dark">
          <RNView style={styles.modalContent}>
            <RNView style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择年级</Text>
              <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </RNView>

            {loading ? (
              <RNView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>正在加载年级...</Text>
              </RNView>
            ) : error ? (
              <RNView style={styles.errorContainer}>
                <Ionicons name="warning" size={36} color="#FF9600" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchGrades}>
                  <Text style={styles.retryButtonText}>重试</Text>
                </TouchableOpacity>
              </RNView>
            ) : (
              <FlatList
                data={groupedGrades}
                renderItem={renderLevelSection}
                keyExtractor={(item) => item.level}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </RNView>
        </BlurView>
      </RNView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
    width: Dimensions.get("window").width * 0.85,
    maxWidth: 400,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  modalContent: {
    padding: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeIconButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  levelSection: {
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  levelIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  gradeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginLeft: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  gradeDescription: {
    fontSize: 12,
    color: "#777",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#58CC02",
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default GradeModal; 