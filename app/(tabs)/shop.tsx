import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  View as RNView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Text, View } from "../../components/Themed";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// 临时用户ID，实际应用中应该从认证系统获取
const USER_ID = "user1";

// 商品数据
const SHOP_ITEMS = [
  {
    id: "item1",
    name: "数学公式手册",
    description: "包含常用数学公式和解题技巧的精美手册",
    points: 50,
    image: "https://i.imgur.com/NhBFjc6.png",
  },
  {
    id: "item2",
    name: "学习徽章",
    description: "精美的学习成就徽章，可以佩戴在书包上",
    points: 100,
    image: "https://i.imgur.com/h3pFJG3.png",
  },
  {
    id: "item3",
    name: "定制笔记本",
    description: "高质量的定制笔记本，印有你的名字",
    points: 200,
    image: "https://i.imgur.com/F9zS3OT.png",
  },
  {
    id: "item4",
    name: "学习文具套装",
    description: "包含铅笔、橡皮、尺子等学习必备文具",
    points: 150,
    image: "https://i.imgur.com/NhBFjc6.png",
  },
  {
    id: "item5",
    name: "知识海报",
    description: "精美的知识海报，可以贴在墙上帮助记忆",
    points: 80,
    image: "https://i.imgur.com/h3pFJG3.png",
  },
  {
    id: "item6",
    name: "学习计时器",
    description: "帮助你管理学习时间的计时器",
    points: 120,
    image: "https://i.imgur.com/F9zS3OT.png",
  },
];

// 商品详情弹窗组件
const ItemDetailModal = ({
  visible,
  item,
  onClose,
  onExchange,
  userPoints,
}: {
  visible: boolean;
  item: any;
  onClose: () => void;
  onExchange: () => void;
  userPoints: number;
}) => {
  const canExchange = userPoints >= item?.points;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <RNView style={styles.modalOverlay}>
        <RNView style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {item && (
            <>
              <Image source={{ uri: item.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{item.name}</Text>
              <Text style={styles.modalDescription}>{item.description}</Text>

              <RNView style={styles.pointsContainer}>
                <FontAwesome5 name="gem" size={16} color="#1CB0F6" solid />
                <Text style={styles.pointsText}>{item.points} 积分</Text>
              </RNView>

              <TouchableOpacity
                style={[styles.exchangeButton, !canExchange && styles.disabledButton]}
                onPress={onExchange}
                disabled={!canExchange}
              >
                <Text style={styles.exchangeButtonText}>{canExchange ? "立即兑换" : "积分不足"}</Text>
              </TouchableOpacity>

              {!canExchange && (
                <Text style={styles.insufficientText}>还差 {item.points - userPoints} 积分才能兑换</Text>
              )}
            </>
          )}
        </RNView>
      </RNView>
    </Modal>
  );
};

// 兑换成功弹窗组件
const ExchangeSuccessModal = ({ visible, item, onClose }: { visible: boolean; item: any; onClose: () => void }) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <RNView style={styles.modalOverlay}>
        <RNView style={[styles.modalContent, styles.successModal]}>
          <RNView style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </RNView>
          <Text style={styles.successTitle}>兑换成功</Text>
          <Text style={styles.successMessage}>您已成功兑换 {item?.name}</Text>
          <Text style={styles.successSubMessage}>客服将尽快联系您安排发货</Text>
          <TouchableOpacity style={styles.successButton} onPress={onClose}>
            <Text style={styles.successButtonText}>确定</Text>
          </TouchableOpacity>
        </RNView>
      </RNView>
    </Modal>
  );
};

export default function ShopScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // 获取用户积分
  const fetchUserPoints = async () => {
    try {
      const response = await fetch(`http://101.126.135.102:3000/api/users/${USER_ID}/points`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserPoints(data.data.points);
        }
      }
    } catch (error) {
      console.error("获取用户积分出错:", error);
    } finally {
      setLoading(false);
    }
  };

  // 兑换商品
  const exchangeItem = async (item: any) => {
    if (userPoints < item.points) {
      Alert.alert("积分不足", "您的积分不足以兑换该商品");
      return;
    }

    setExchanging(true);

    try {
      const response = await fetch(`http://101.126.135.102:3000/api/users/${USER_ID}/points/deduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points: item.points,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserPoints(data.data.points);
          setModalVisible(false);
          setSuccessModalVisible(true);
        } else {
          Alert.alert("兑换失败", data.message);
        }
      } else {
        Alert.alert("兑换失败", "请稍后再试");
      }
    } catch (error) {
      console.error("兑换商品出错:", error);
      Alert.alert("兑换失败", "网络错误，请稍后再试");
    } finally {
      setExchanging(false);
    }
  };

  // 打开商品详情
  const openItemDetail = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // 初始加载
  useEffect(() => {
    fetchUserPoints();
  }, []);

  return (
    <View style={styles.container}>
      {/* 顶部状态栏 */}
      <RNView style={styles.header}>
        <Text style={styles.headerTitle}>积分商城</Text>
        <RNView style={styles.pointsDisplay}>
          <FontAwesome5 name="gem" size={16} color="#1CB0F6" solid />
          <Text style={styles.pointsValue}>{userPoints}</Text>
        </RNView>
      </RNView>

      {loading ? (
        <RNView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1CB0F6" />
          <Text style={styles.loadingText}>加载中...</Text>
        </RNView>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 商品列表 */}
          <RNView style={styles.itemsGrid}>
            {SHOP_ITEMS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => openItemDetail(item)}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <Text style={styles.itemName}>{item.name}</Text>
                <RNView style={styles.itemPoints}>
                  <FontAwesome5 name="gem" size={12} color="#1CB0F6" solid />
                  <Text style={styles.itemPointsText}>{item.points}</Text>
                </RNView>
              </TouchableOpacity>
            ))}
          </RNView>

          {/* 底部提示 */}
          <RNView style={styles.tipContainer}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.tipText}>每答对一道题可获得1积分，积分可用于兑换各种礼品</Text>
          </RNView>
        </ScrollView>
      )}

      {/* 商品详情弹窗 */}
      <ItemDetailModal
        visible={modalVisible}
        item={selectedItem}
        onClose={() => setModalVisible(false)}
        onExchange={() => exchangeItem(selectedItem)}
        userPoints={userPoints}
      />

      {/* 兑换成功弹窗 */}
      <ExchangeSuccessModal
        visible={successModalVisible}
        item={selectedItem}
        onClose={() => setSuccessModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1CB0F6",
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
    resizeMode: "contain",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  itemPoints: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemPointsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1CB0F6",
    marginLeft: 4,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  modalImage: {
    width: 120,
    height: 120,
    marginVertical: 20,
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1CB0F6",
    marginLeft: 6,
  },
  exchangeButton: {
    backgroundColor: "#1CB0F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  exchangeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  insufficientText: {
    marginTop: 10,
    fontSize: 14,
    color: "#FF6B6B",
  },
  successModal: {
    alignItems: "center",
    padding: 20,
    maxWidth: 300,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4CAF50",
  },
  successMessage: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  successSubMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  successButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
