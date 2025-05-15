import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, View as RNView, FlatList } from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSubject } from "@/hooks/useSubject";
import { API_BASE_URL } from "@/constants/apiConfig";

export default function SubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { code, name } = params;
  const { currentSubject } = useSubject();

  // 确保code是单个字符串
  const subjectCode = Array.isArray(code) ? code[0] : code || "";
  const subjectName = Array.isArray(name) ? name[0] : name || "学科";
  // 如果URL中没有color参数，使用当前主题颜色
  const subjectColor = subjectCode === currentSubject.code ? currentSubject.color : "#5EC0DE";

  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, [subjectCode]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectCode}/units`);
      if (!response.ok) {
        throw new Error("获取单元列表失败");
      }

      const data = await response.json();
      if (data.success) {
        // 处理单元数据，构建树形结构
        const parentUnits = data.data.filter((unit: any) => unit.level === 1);
        const childUnits = data.data.filter((unit: any) => unit.level === 2);

        // 将子单元添加到父单元中
        const unitsWithChildren = parentUnits.map((parent: any) => {
          const children = childUnits.filter((child: any) => child.parentId === parent.id);
          return {
            ...parent,
            children,
          };
        });

        setUnits(unitsWithChildren);
      } else {
        setError(data.message || "获取单元列表失败");
      }
    } catch (error) {
      console.error("获取单元列表出错:", error);
      setError("获取单元列表出错，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const renderChildUnit = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.childUnitItem}
      onPress={() =>
        router.push({
          pathname: "/study",
          params: {
            id: item.id,
            unitTitle: item.title,
            color: subjectColor,
            secondaryColor: getLighterColor(subjectColor),
          },
        })
      }
    >
      <RNView style={[styles.childUnitDot, { backgroundColor: subjectColor }]} />
      <Text style={styles.childUnitTitle}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );

  const renderUnit = ({ item }: { item: any }) => (
    <View style={styles.unitCard}>
      <View style={styles.unitHeader}>
        <RNView style={[styles.unitIcon, { backgroundColor: subjectColor }]}>
          <Ionicons name="book" size={24} color="white" />
        </RNView>
        <Text style={styles.unitTitle}>{item.title}</Text>
      </View>

      {item.description && <Text style={styles.unitDescription}>{item.description}</Text>}

      {item.children && item.children.length > 0 ? (
        <View style={styles.childUnitsContainer}>
          {item.children.map((child: any) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childUnitItem}
              onPress={() =>
                router.push({
                  pathname: "/study",
                  params: {
                    id: child.id,
                    unitTitle: child.title,
                    color: subjectColor,
                    secondaryColor: getLighterColor(subjectColor),
                  },
                })
              }
            >
              <RNView style={[styles.childUnitDot, { backgroundColor: subjectColor }]} />
              <Text style={styles.childUnitTitle}>{child.title}</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyChildContainer}>
          <Text style={styles.emptyChildText}>暂无小节内容</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: subjectName,
          headerStyle: {
            backgroundColor: subjectColor,
          },
          headerTintColor: "#fff",
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={subjectColor} />
          <Text style={styles.loadingText}>加载单元...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4B4B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: subjectColor }]} onPress={fetchUnits}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={units}
          renderItem={renderUnit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>暂无单元，请添加单元内容</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#FF4B4B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#5EC0DE",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  unitCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  unitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#5EC0DE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  unitDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  childUnitsContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
  },
  childUnitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  childUnitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5EC0DE",
    marginRight: 8,
  },
  childUnitTitle: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  emptyContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptyChildContainer: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  emptyChildText: {
    fontSize: 14,
    color: "#999",
  },
});

// 在文件下方添加用于生成次要颜色的函数
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
