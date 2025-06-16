import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { Picker } from '@react-native-picker/picker';
import { studentRegister, type RegisterRequest } from '../services/authService';

const RegisterScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterRequest>({
    studentId: '',
    password: '',
    name: '',
    nickname: '',
    email: '',
    phone: '',
    gender: 'male',
    grade: '',
    school: '',
    parentName: '',
    parentPhone: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.studentId.trim()) {
      Alert.alert('验证失败', '请输入学生账号');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('验证失败', '请输入密码');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('验证失败', '密码长度至少6位');
      return false;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('验证失败', '两次输入的密码不一致');
      return false;
    }

    if (!formData.name.trim()) {
      Alert.alert('验证失败', '请输入真实姓名');
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('验证失败', '请输入有效的邮箱地址');
      return false;
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      Alert.alert('验证失败', '请输入有效的手机号码');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await studentRegister(formData);
      
      if (result.success && result.student) {
        Alert.alert('注册成功', `欢迎加入学习平台，${result.student.name}！`, [
          {
            text: '确定',
            onPress: () => {
              // 跳转到主页面
              router.replace('/(tabs)');
            },
          },
        ]);
      } else {
        Alert.alert('注册失败', result.message);
      }
    } catch (error) {
      console.error('注册错误:', error);
      Alert.alert('注册失败', '发生未知错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* 返回按钮 */}
            <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* 标题部分 */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={60} color="white" />
              </View>
              <Text style={styles.title}>学生注册</Text>
              <Text style={styles.subtitle}>加入我们的学习平台</Text>
            </View>

            {/* 表单部分 */}
            <View style={styles.formContainer}>
              {/* 学生账号 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="学生账号*"
                    placeholderTextColor="#999"
                    value={formData.studentId}
                    onChangeText={(value) => handleInputChange('studentId', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* 真实姓名 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="真实姓名*"
                    placeholderTextColor="#999"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                  />
                </View>
              </View>

              {/* 昵称 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="happy-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="昵称（可选）"
                    placeholderTextColor="#999"
                    value={formData.nickname}
                    onChangeText={(value) => handleInputChange('nickname', value)}
                  />
                </View>
              </View>

              {/* 密码 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="密码*（至少6位）"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 确认密码 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="确认密码*"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 性别选择 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="transgender-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TouchableOpacity 
                    style={styles.genderSelector}
                    onPress={() => {
                      Alert.alert(
                        '选择性别',
                        '',
                        [
                          { text: '男', onPress: () => handleInputChange('gender', 'male') },
                          { text: '女', onPress: () => handleInputChange('gender', 'female') },
                          { text: '其他', onPress: () => handleInputChange('gender', 'other') },
                          { text: '取消', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.genderText}>
                      {formData.gender === 'male' ? '男' : formData.gender === 'female' ? '女' : '其他'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 邮箱 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="邮箱（可选）"
                    placeholderTextColor="#999"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* 手机号 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="手机号（可选）"
                    placeholderTextColor="#999"
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* 年级 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="school-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="年级（如：高一、初二）"
                    placeholderTextColor="#999"
                    value={formData.grade}
                    onChangeText={(value) => handleInputChange('grade', value)}
                  />
                </View>
              </View>

              {/* 学校 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="学校名称（可选）"
                    placeholderTextColor="#999"
                    value={formData.school}
                    onChangeText={(value) => handleInputChange('school', value)}
                  />
                </View>
              </View>

              {/* 家长姓名 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="people-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="家长姓名（可选）"
                    placeholderTextColor="#999"
                    value={formData.parentName}
                    onChangeText={(value) => handleInputChange('parentName', value)}
                  />
                </View>
              </View>

              {/* 家长手机 */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="家长手机（可选）"
                    placeholderTextColor="#999"
                    value={formData.parentPhone}
                    onChangeText={(value) => handleInputChange('parentPhone', value)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* 注册按钮 */}
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.registerButtonText}>注册</Text>
                )}
              </TouchableOpacity>

              {/* 底部链接 */}
              <View style={styles.bottomContainer}>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.linkText}>
                    已有账号？<Text style={styles.linkHighlight}>立即登录</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  backButton: {
    marginTop: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  genderSelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  genderText: {
    fontSize: 14,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  linkHighlight: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 