import { StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Text, View } from "../../components/Themed";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [dailyReminder, setDailyReminder] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");
  const [examCountdown, setExamCountdown] = useState(true);
  const [autoPlayVideo, setAutoPlayVideo] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>学习设置</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>学习计划</Text>
          <Text style={styles.settingValue}>每周5天 &gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>难度级别</Text>
          <Text style={styles.settingValue}>初三进阶 &gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>中考倒计时</Text>
          <Text style={styles.settingValue}>120天 &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>每日学习提醒</Text>
          <Switch
            value={dailyReminder}
            onValueChange={setDailyReminder}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>夜间模式</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>考试倒计时显示</Text>
          <Switch
            value={examCountdown}
            onValueChange={setExamCountdown}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>自动播放视频</Text>
          <Switch
            value={autoPlayVideo}
            onValueChange={setAutoPlayVideo}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>离线模式</Text>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>家长监控</Text>
          <Text style={styles.settingValue}>&gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>错题收藏</Text>
          <Text style={styles.settingValue}>57题 &gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>关于我们</Text>
          <Text style={styles.settingValue}>&gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.logoutButton]}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    borderRadius: 8,
  },
  settingText: {
    fontSize: 16,
  },
  settingValue: {
    color: "#666",
  },
  logoutButton: {
    justifyContent: "center",
    backgroundColor: "#ffeeee",
    marginTop: 16,
  },
  logoutText: {
    color: "#ff3b30",
    textAlign: "center",
    fontWeight: "bold",
  },
});
