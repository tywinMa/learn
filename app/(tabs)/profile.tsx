import { StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text, View } from "../../components/Themed";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: "https://via.placeholder.com/100" }} style={styles.avatar} />
        <Text style={styles.name}>用户名</Text>
        <Text style={styles.bio}>这是一个简短的个人介绍</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>120</Text>
          <Text style={styles.statLabel}>关注</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>348</Text>
          <Text style={styles.statLabel}>粉丝</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>25</Text>
          <Text style={styles.statLabel}>帖子</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.editButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}>
        <Text style={styles.editButtonText}>编辑资料</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>个人信息</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>邮箱:</Text>
          <Text style={styles.infoValue}>user@example.com</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>位置:</Text>
          <Text style={styles.infoValue}>北京, 中国</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>加入时间:</Text>
          <Text style={styles.infoValue}>2023年1月</Text>
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
});
