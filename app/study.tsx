import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View as RNView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '../components/Themed';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

// 视频资源映射
const VIDEO_RESOURCES = {
  '1-1': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', // 示例视频URL
  '1-2': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '1-3': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '1-4': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '2-1': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '2-2': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '2-3': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '3-1': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  '3-2': 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
};

// 练习题组件
const Exercise = ({
  exercise,
  onAnswer,
  userAnswers
}: {
  exercise: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number
  };
  onAnswer: (exerciseId: string, optionIndex: number) => void;
  userAnswers: Record<string, number>;
}) => {
  const isAnswered = userAnswers.hasOwnProperty(exercise.id);
  const isCorrect = isAnswered && userAnswers[exercise.id] === exercise.correctAnswer;

  return (
    <RNView style={styles.exerciseContainer}>
      <Text style={styles.questionText}>{exercise.question}</Text>

      {exercise.options.map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            isAnswered && userAnswers[exercise.id] === index && styles.selectedOption,
            isAnswered && index === exercise.correctAnswer && styles.correctOption,
          ]}
          onPress={() => onAnswer(exercise.id, index)}
          disabled={isAnswered}
        >
          <Text style={styles.optionText}>{option}</Text>
          {isAnswered && index === exercise.correctAnswer && (
            <Ionicons name="checkmark-circle" size={24} color="green" style={styles.icon} />
          )}
          {isAnswered && userAnswers[exercise.id] === index && index !== exercise.correctAnswer && (
            <Ionicons name="close-circle" size={24} color="red" style={styles.icon} />
          )}
        </TouchableOpacity>
      ))}

      {isAnswered && (
        <Text style={[styles.feedbackText, isCorrect ? styles.correctText : styles.incorrectText]}>
          {isCorrect ? '回答正确！' : '回答错误，请再试一次。'}
        </Text>
      )}
    </RNView>
  );
};

export default function StudyScreen() {
  const params = useLocalSearchParams();
  const { id, unitTitle, color } = params;
  const exerciseIdParam = Array.isArray(params.exerciseId) ? params.exerciseId[0] : params.exerciseId;

  const router = useRouter();
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [videoStatus, setVideoStatus] = useState<any>({});
  const screenWidth = Dimensions.get('window').width;
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 临时用户ID，实际应用中应该从认证系统获取
  const USER_ID = 'user1';

  const handleAnswer = async (exerciseId: string, optionIndex: number) => {
    // 更新本地状态
    setUserAnswers(prev => ({
      ...prev,
      [exerciseId]: optionIndex
    }));

    // 获取当前练习题
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    // 判断答案是否正确
    const isCorrect = optionIndex === exercise.correctAnswer;

    // 提交答题结果到服务器
    try {
      // 使用 IP 地址而不是 localhost，这样在真机上也能正常工作
      const apiUrl = `http://192.168.3.43:3000/api/users/${USER_ID}/submit`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          unitId: lessonId,
          isCorrect
        }),
      });

      if (!response.ok) {
        console.error('提交答题结果失败');
      }
    } catch (err) {
      console.error('提交答题结果出错:', err);
    }
  };

  const handleVideoStatusUpdate = (status: any) => {
    setVideoStatus(status);
  };

  // 确保 id 是单个字符串
  const lessonId = Array.isArray(id) ? id[0] : id || '1-1';
  const videoUrl = VIDEO_RESOURCES[lessonId as keyof typeof VIDEO_RESOURCES] || 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';

  // 从API获取练习题
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        // 这里使用你的API地址，开发环境可以使用localhost
        // 如果在真机上测试，需要使用实际的IP地址或域名

        if (exerciseIdParam) {
          // 获取特定的练习题
          // 使用 IP 地址而不是 localhost，这样在真机上也能正常工作
          const apiUrl = `http://192.168.3.43:3000/api/exercises/${lessonId}/${exerciseIdParam}`;
          const response = await fetch(apiUrl);

          if (!response.ok) {
            throw new Error('获取练习题失败');
          }

          const result = await response.json();

          if (result.success && result.data) {
            setExercises([result.data]);
          } else {
            throw new Error(result.message || '获取练习题失败');
          }
        } else {
          // 获取单元的所有练习题，过滤掉已完成的
          // 使用 IP 地址而不是 localhost，这样在真机上也能正常工作
          const apiUrl = `http://192.168.3.43:3000/api/exercises/${lessonId}?userId=${USER_ID}&filterCompleted=true`;
          const response = await fetch(apiUrl);

          if (!response.ok) {
            throw new Error('获取练习题失败');
          }

          const result = await response.json();

          if (result.success && result.data) {
            setExercises(result.data);
          } else {
            throw new Error(result.message || '获取练习题失败');
          }
        }
      } catch (err: any) {
        console.error('获取练习题出错:', err);
        setError(err.message || '获取练习题失败，请稍后再试');
        // 如果API请求失败，使用默认练习题
        setExercises([
          {
            id: '1',
            question: '解一元二次方程：x² - 5x + 6 = 0',
            options: ['x = 2 或 x = 3', 'x = -2 或 x = -3', 'x = 2 或 x = -3', 'x = -2 或 x = 3'],
            correctAnswer: 0,
          },
          {
            id: '2',
            question: '已知三角形的两边长分别为3和4，且夹角为60°，求第三边的长度。',
            options: ['5', '√13', '√19', '7'],
            correctAnswer: 2,
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [lessonId, exerciseIdParam]);

  return (
    <View style={styles.container}>
      {/* 隐藏默认的导航栏 */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 状态栏设置为浅色 */}
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 自定义header */}
      <RNView style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // 使用 router.replace 替代 router.back，这样更可靠
            router.replace('/(tabs)');
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle || '初三数学课程'}</Text>
        <RNView style={styles.placeholder} />
      </RNView>

      <ScrollView style={styles.scrollContent}>
        <RNView style={styles.videoContainer}>
          <Video
            source={{ uri: videoUrl }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            useNativeControls
            style={{
              width: screenWidth,
              height: 230,
            }}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
          />
        </RNView>

        <RNView style={styles.lessonContent}>
          <Text style={styles.sectionTitle}>内容简介</Text>
          <Text style={styles.descriptionText}>
            本节课将讲解初三数学的重要概念，包括一元二次方程的解法、三角函数、函数最值以及代数式的化简。通过观看视频和完成练习题，你将掌握这些关键知识点。
          </Text>

          <Text style={styles.sectionTitle}>课后练习</Text>

          {loading ? (
            <RNView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5EC0DE" />
              <Text style={styles.loadingText}>加载练习题...</Text>
            </RNView>
          ) : error ? (
            <RNView style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="red" />
              <Text style={styles.errorText}>{error}</Text>
            </RNView>
          ) : exercises.length === 0 ? (
            <Text style={styles.noExercisesText}>暂无练习题</Text>
          ) : (
            exercises.map(exercise => (
              <Exercise
                key={exercise.id}
                exercise={exercise}
                onAnswer={handleAnswer}
                userAnswers={userAnswers}
              />
            ))
          )}
        </RNView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingTop: 16, // 减少顶部padding
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonContent: {
    padding: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  exerciseContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  selectedOption: {
    borderColor: '#5EC0DE',
    borderWidth: 2,
  },
  correctOption: {
    borderColor: 'green',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  icon: {
    marginLeft: 8,
  },
  feedbackText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  correctText: {
    color: 'green',
  },
  incorrectText: {
    color: 'red',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'red',
  },
  noExercisesText: {
    padding: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
