import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SubjectProvider, useSubject } from "@/hooks/useSubject";
import { WELCOME_SCREEN_KEY } from "@/constants/Colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null); // To store the determined initial route

  const [loaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // Add other fonts here if you have them
  });

  // Effect to determine the initial route and manage app readiness
  useEffect(() => {
    async function prepareAppAndDetermineRoute() {
      console.log("[RootLayout] prepareAppAndDetermineRoute started.");
      try {
        // Wait for fonts to load or error
        if (!loaded && !fontError) {
          console.log("[RootLayout] Fonts not yet loaded or errored. Waiting...");
          return; // Exit and wait for font status to change
        }
        if (fontError) {
          console.warn("[RootLayout] Error loading fonts: ", fontError);
          // Potentially handle font loading errors
        }
        console.log("[RootLayout] Fonts loaded or font error handled.");

        // Check if welcome screen has been seen
        const hasSeenWelcome = await AsyncStorage.getItem(WELCOME_SCREEN_KEY);
        console.log(`[RootLayout] Value of '${WELCOME_SCREEN_KEY}' from AsyncStorage:`, hasSeenWelcome);

        if (hasSeenWelcome === "true") {
          setInitialRoute("/(tabs)");
          console.log("[RootLayout] Welcome screen has been seen. Initial route set to /(tabs).");
        } else {
          setInitialRoute("/welcome");
          console.log("[RootLayout] Welcome screen NOT seen. Initial route set to /welcome.");
        }
      } catch (e) {
        console.error("[RootLayout] Error during app preparation/route determination: ", e);
        // Fallback strategy: set a default route
        setInitialRoute("/(tabs)");
        console.log("[RootLayout] Fallback: Initial route set to /(tabs) due to error.");
      } finally {
        // Only set appIsReady to true if fonts have been processed (loaded or errored)
        // AND initialRoute has had a chance to be set (even if it was an error leading to a fallback).
        if (loaded || fontError) {
          console.log("[RootLayout] Font processing and route determination complete. Setting appIsReady to true.");
          setAppIsReady(true);
        }
      }
    }

    prepareAppAndDetermineRoute();
  }, [loaded, fontError]); // Re-run if font status changes

  // Effect to navigate once the app is ready and initial route is determined
  useEffect(() => {
    if (appIsReady && initialRoute) {
      console.log(`[RootLayout] App is ready and initial route '${initialRoute}' is set. Navigating.`);
      router.replace(initialRoute as any);
      // Hide splash screen AFTER navigation is triggered
      SplashScreen.hideAsync().catch((e) => console.warn("[RootLayout] SplashScreen.hideAsync error: ", e));
    } else if (appIsReady && !initialRoute) {
      // This case should ideally not be hit if prepareAppAndDetermineRoute always sets an initialRoute (even a fallback)
      console.warn("[RootLayout] App is ready, but initialRoute is not set. Hiding splash screen anyway.");
      SplashScreen.hideAsync().catch((e) => console.warn("[RootLayout] SplashScreen.hideAsync error: ", e));
    }
  }, [appIsReady, initialRoute, router]); // Re-run if these values change

  if (!appIsReady) {
    console.log("[RootLayout] App not ready yet (fonts loading or initial route being determined). Returning null.");
    return null; // Show native splash screen
  }

  console.log("[RootLayout] App is ready, rendering SubjectProvider and RootLayoutNav.");
  return (
    <SubjectProvider>
      <RootLayoutNav />
    </SubjectProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { currentSubject } = useSubject(); // Assuming useSubject hook provides default/initial subject context

  const themeToUse = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  // Create a custom theme that incorporates the subject color for primary elements
  const customTheme = {
    ...themeToUse,
    colors: {
      ...themeToUse.colors,
      primary: currentSubject?.color || themeToUse.colors.primary, // Use subject color or default
      // card: currentSubject?.color || themeToUse.colors.card, // Optional: if you want cards to also use subject color
      // border: currentSubject?.color || themeToUse.colors.border, // Optional
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      {/* The Stack navigator is the layout component.
          Initial route is handled by the RootLayout's useEffect. */}
      <Stack>
        {/* Welcome screen should not have a header typically */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        {/* Main app tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Other screens in your app */}
        <Stack.Screen
          name="study"
          options={{
            headerShown: true,
            headerBackTitle: "返回",
            // Example of using theme color for header
            // headerStyle: { backgroundColor: customTheme.colors.primary },
            // headerTintColor: customTheme.colors.text, // Or a contrasting color like white
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
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
