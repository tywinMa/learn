import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, SplashScreen as ExpoRouterSplashScreen } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Text, View } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SubjectProvider, useSubject } from "@/hooks/useSubject";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// 主应用布局容器
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  
  // 添加状态控制是否显示欢迎界面
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    console.log("RootLayout挂载，showWelcome:", showWelcome);
    
    if (loaded) {
      console.log("字体加载完成，隐藏SplashScreen");
      SplashScreen.hideAsync().catch(e => console.log("隐藏SplashScreen错误:", e));
    }
  }, [loaded, showWelcome]);

  if (!loaded) {
    console.log("字体尚未加载完成");
    return null;
  }

  return (
    <SubjectProvider>
      <RootLayoutNav initialShowWelcome={showWelcome} />
    </SubjectProvider>
  );
}

function RootLayoutNav({ initialShowWelcome }: { initialShowWelcome: boolean }) {
  const colorScheme = useColorScheme();
  const { currentSubject } = useSubject();
  
  useEffect(() => {
    console.log("RootLayoutNav挂载，initialShowWelcome:", initialShowWelcome);
  }, [initialShowWelcome]);
  
  // 创建自定义主题，包含当前学科颜色
  const customTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: currentSubject.color,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: currentSubject.color,
    },
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? customDarkTheme : customTheme}>
      <Stack>
        <Stack.Screen 
          name="welcome" 
          options={{ 
            headerShown: false,
            presentation: 'transparentModal',
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="study"
          options={{
            headerShown: true,
            headerBackTitle: "返回",
          }}
        />
        <Stack.Screen name="practice" options={{ headerShown: true }} />
        <Stack.Screen
          name="subject/[code]"
          options={{
            headerShown: true,
            title: "学科详情",
            headerBackTitle: "返回",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
