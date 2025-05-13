import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Welcome() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [buttonFadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 播放淡入动画
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 延迟显示按钮，让它在内容显示后再淡入
    const buttonTimer = setTimeout(() => {
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(buttonTimer);
  }, [fadeAnim, buttonFadeAnim]);

  // 处理按钮点击，跳转到主界面
  const handleStartPress = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <Text style={styles.debugText}>欢迎界面正在显示</Text>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>欢迎使用</Text>
        <Text style={styles.subtitle}>学习成长的好伙伴</Text>
        
        <Animated.View style={{ opacity: buttonFadeAnim, marginTop: 50 }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleStartPress}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>开始使用</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
  },
  debugText: {
    position: "absolute",
    top: -100,
    color: "blue",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
