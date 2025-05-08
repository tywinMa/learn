import { useColorScheme as _useColorScheme } from "react-native";

// useColorScheme钩子的封装，定义返回类型
export function useColorScheme(): "light" | "dark" {
  return _useColorScheme() === "dark" ? "dark" : "light";
}
