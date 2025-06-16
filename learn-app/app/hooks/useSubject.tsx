import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 学科存储键
export const CURRENT_SUBJECT_KEY = "currentSubject";

// 学科类型定义
export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  iconName: string;
}

// 默认学科设置
const DEFAULT_SUBJECT: Subject = {
  id: 1,
  name: "数学",
  code: "math",
  description: "学习基础数学知识",
  color: "#58CC02",
  iconName: "math-compass",
};

// 上下文类型
interface SubjectContextType {
  currentSubject: Subject;
  setCurrentSubject: (subject: Subject) => void;
  saveCurrentSubject: (subject: Subject) => Promise<void>;
  loadCurrentSubject: () => Promise<Subject | null>;
}

// 创建上下文
const SubjectContext = createContext<SubjectContextType>({
  currentSubject: DEFAULT_SUBJECT,
  setCurrentSubject: () => {},
  saveCurrentSubject: async () => {},
  loadCurrentSubject: async () => null,
});

// Subject Provider组件
export const SubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSubject, setCurrentSubject] = useState<Subject>(DEFAULT_SUBJECT);

  // 保存学科到AsyncStorage
  const saveCurrentSubject = async (subject: Subject) => {
    try {
      await AsyncStorage.setItem(CURRENT_SUBJECT_KEY, JSON.stringify(subject));
    } catch (error) {
      console.error("保存学科出错:", error);
    }
  };

  // 从AsyncStorage加载学科
  const loadCurrentSubject = async (): Promise<Subject | null> => {
    try {
      const savedSubject = await AsyncStorage.getItem(CURRENT_SUBJECT_KEY);
      if (savedSubject) {
        return JSON.parse(savedSubject);
      }
      return null;
    } catch (error) {
      console.error("加载学科出错:", error);
      return null;
    }
  };

  // 初始化时加载保存的学科
  useEffect(() => {
    const initSubject = async () => {
      const savedSubject = await loadCurrentSubject();
      if (savedSubject) {
        setCurrentSubject(savedSubject);
      }
    };

    initSubject();
  }, []);

  return (
    <SubjectContext.Provider
      value={{
        currentSubject,
        setCurrentSubject,
        saveCurrentSubject,
        loadCurrentSubject,
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};

// 自定义Hook来使用Subject上下文
export const useSubject = () => useContext(SubjectContext);

export default useSubject;
