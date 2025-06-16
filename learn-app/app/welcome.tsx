import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; // Assuming you have this or similar for icons
import { WELCOME_SCREEN_KEY } from "@/constants/Colors";

const WelcomeScreen = () => {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_SCREEN_KEY, "true");
      console.log(`[WelcomeScreen] Flag '${WELCOME_SCREEN_KEY}' set to true.`);
      router.replace("/(tabs)"); // Adjust if your main route is different
    } catch (error) {
      console.error("[WelcomeScreen] Failed to save welcome screen status:", error);
      // Still navigate, but log the error. User experience is to proceed.
      router.replace("/(tabs)");
    }
  };

  return (
    <LinearGradient
      colors={["#6e48eb", "#4b2c9a"]} // Example gradient, adjust as needed
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <Ionicons name="rocket-outline" size={100} color="white" style={styles.icon} />
          <Text style={styles.title}>欢迎使用!</Text>
          <Text style={styles.subtitle}>准备好开始您的学习之旅了吗？</Text>
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>开始探索</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginBottom: 50,
    lineHeight: 26,
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 45,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    color: "#4b2c9a", // Matching one of the gradient colors
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
