import Constants from "expo-constants";

// 尝试从 Expo manifest 获取环境变量，如果定义了的话
const ENV = Constants.expoConfig?.extra;

const isDevelopment = process.env.NODE_ENV === "development";
const developmentApiUrl = "http://localhost:3000"; // 开发环境API
const productionApiUrl = "http://101.126.135.102:3000"; // 生产环境API

// 判断当前环境，Expo Go 和本地开发通常 __DEV__ 为 true
export const API_BASE_URL = isDevelopment ? developmentApiUrl : productionApiUrl;
