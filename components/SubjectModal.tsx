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
import { useSubject, Subject } from "@/hooks/useSubject";

// API基础URL
const API_BASE_URL = "http://101.126.135.102:3000";

interface SubjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSubject: (subject: Subject) => void;
}

const SubjectModal = ({ visible, onClose, onSelectSubject }: SubjectModalProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentSubject } = useSubject();

  // 获取学科列表
  useEffect(() => {
    if (visible) {
      fetchSubjects();
    }
  }, [visible]);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/subjects`);
      const result = await response.json();

      if (result.success) {
        // 从API获取学科数据，包含服务器设置的颜色和图标
        setSubjects(result.data);
      } else {
        setError("获取学科列表失败");
      }
    } catch (err) {
      console.error("获取学科列表出错:", err);
      setError("网络请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 渲染学科项
  const renderSubjectItem = ({ item }: { item: Subject }) => {
    const isSelected = item.code === currentSubject.code;

    return (
      <TouchableOpacity
        style={[styles.subjectItem, isSelected && { borderColor: item.color, backgroundColor: `${item.color}10` }]}
        onPress={() => onSelectSubject(item)}
      >
        <RNView style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <MaterialCommunityIcons name={item.iconName as any} size={24} color="white" />
        </RNView>

        <RNView style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{item.name}</Text>
          <Text style={styles.subjectDescription} numberOfLines={1}>
            {item.description || `探索${item.name}的奥秘`}
          </Text>
        </RNView>

        {isSelected && (
          <RNView style={[styles.selectedIndicator, { backgroundColor: item.color }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </RNView>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <RNView style={styles.modalOverlay}>
        <BlurView intensity={50} style={styles.blurContainer} tint="dark">
          <RNView style={styles.modalContent}>
            <RNView style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择学科</Text>
              <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </RNView>

            {loading ? (
              <RNView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>正在加载学科...</Text>
              </RNView>
            ) : error ? (
              <RNView style={styles.errorContainer}>
                <Ionicons name="warning" size={36} color="#FF9600" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchSubjects}>
                  <Text style={styles.retryButtonText}>重试</Text>
                </TouchableOpacity>
              </RNView>
            ) : (
              <FlatList
                data={subjects}
                renderItem={renderSubjectItem}
                keyExtractor={(item) => item.id.toString()}
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
    maxHeight: Dimensions.get("window").height * 0.7,
  },
  modalContent: {
    padding: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: Dimensions.get("window").height * 0.7,
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
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subjectDescription: {
    fontSize: 14,
    color: "#777",
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#58CC02",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF9600",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SubjectModal;
