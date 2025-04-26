import { StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text, View } from "../../components/Themed";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: "https://i.imgur.com/BzfaYLR.png" }} style={styles.avatar} />
        <Text style={styles.name}>小明同学</Text>
        <Text style={styles.bio}>初三数学爱好者，正在备战中考</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>82</Text>
          <Text style={styles.statLabel}>题目完成</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>95%</Text>
          <Text style={styles.statLabel}>正确率</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>15</Text>
          <Text style={styles.statLabel}>连续学习</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.editButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
        <Text style={styles.editButtonText}>查看学习报告</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>学习档案</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>擅长领域:</Text>
          <Text style={styles.infoValue}>代数、函数图像</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>待加强:</Text>
          <Text style={styles.infoValue}>几何证明、概率统计</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>学习进度:</Text>
          <Text style={styles.infoValue}>初三上学期 (75%)</Text>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>获得成就</Text>
        <View style={styles.achievementContainer}>
          <View style={styles.achievement}>
            <View style={[styles.achievementIcon, { backgroundColor: '#FFD700' }]}>
              <Ionicons name="trophy" size={24} color="white" />
            </View>
            <Text style={styles.achievementText}>代数达人</Text>
          </View>
          <View style={styles.achievement}>
            <View style={[styles.achievementIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="analytics" size={24} color="white" />
            </View>
            <Text style={styles.achievementText}>函数大师</Text>
          </View>
          <View style={styles.achievement}>
            <View style={[styles.achievementIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="flame" size={24} color="white" />
            </View>
            <Text style={styles.achievementText}>习题王者</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: "#ddd",
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 24,
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  infoSection: {
    width: "100%",
    backgroundColor: "transparent",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  infoLabel: {
    fontWeight: "bold",
    width: 80,
  },
  infoValue: {
    flex: 1,
  },
  achievementsSection: {
    width: "100%",
    backgroundColor: "transparent",
  },
  achievementContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  achievement: {
    alignItems: "center",
    marginBottom: 16,
    width: "30%",
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 12,
    textAlign: "center",
  },
});
