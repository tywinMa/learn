import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SubjectProvider, useSubject } from "@/hooks/useSubject";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// 主应用布局容器
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { currentSubject } = useSubject();
  
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

// 根布局组件
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SubjectProvider>
      <RootLayoutNav />
    </SubjectProvider>
  );
}
