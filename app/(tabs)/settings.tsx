import { StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Text, View } from "../../components/Themed";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useState } from "react";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");
  const [locationServices, setLocationServices] = useState(true);
  const [dataSync, setDataSync] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>用户设置</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>账户信息</Text>
          <Text style={styles.settingValue}>修改 &gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>密码</Text>
          <Text style={styles.settingValue}>更改 &gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>隐私设置</Text>
          <Text style={styles.settingValue}>管理 &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>通知</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
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
          <Text style={styles.settingText}>定位服务</Text>
          <Switch
            value={locationServices}
            onValueChange={setLocationServices}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingText}>数据同步</Text>
          <Switch
            value={dataSync}
            onValueChange={setDataSync}
            trackColor={{ false: "#767577", true: Colors[colorScheme ?? "light"].tint }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>关于我们</Text>
          <Text style={styles.settingValue}>&gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>帮助中心</Text>
          <Text style={styles.settingValue}>&gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>联系我们</Text>
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
