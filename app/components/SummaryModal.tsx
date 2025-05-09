import React from "react";
import { StyleSheet, View as RNView, TouchableOpacity, Modal } from "react-native";
import { Text } from "./Themed";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

// 总结弹窗组件
export const SummaryModal = ({
  visible,
  correctCount,
  totalCount,
  onRetry,
  onExit,
}: {
  visible: boolean;
  correctCount: number;
  totalCount: number;
  onRetry: () => void;
  onExit: () => void;
}) => {
  // 计算完成率和星星数
  const completionRate = totalCount > 0 ? correctCount / totalCount : 0;
  const earnedStars = completionRate >= 0.8 ? 3 : completionRate >= 0.6 ? 2 : completionRate > 0 ? 1 : 0;
  const isThreeStars = earnedStars === 3;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onExit}>
      <RNView style={styles.modalOverlay}>
        <RNView style={styles.modalContent}>
          <Text style={styles.modalTitle}>练习完成！</Text>

          <RNView style={styles.summaryContainer}>
            <Text style={styles.summaryText}>本次练习总结：</Text>
            <Text style={styles.summaryDetail}>
              总题数：<Text style={styles.summaryHighlight}>{totalCount}</Text> 题
            </Text>
            <Text style={styles.summaryDetail}>
              答对：<Text style={styles.summaryHighlight}>{correctCount}</Text> 题
            </Text>
            <Text style={styles.summaryDetail}>
              答错：<Text style={styles.summaryHighlight}>{totalCount - correctCount}</Text> 题
            </Text>
            <Text style={styles.summaryDetail}>
              正确率：
              <Text style={styles.summaryHighlight}>
                {totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%
              </Text>
            </Text>

            <RNView style={styles.starsContainer}>
              {[...Array(3)].map((_, i) => (
                <FontAwesome5
                  key={i}
                  name="star"
                  size={30}
                  solid={i < earnedStars}
                  color={i < earnedStars ? "#FFD900" : "#E0E0E0"}
                  style={{ marginHorizontal: 8 }}
                />
              ))}
            </RNView>

            {isThreeStars && (
              <RNView style={styles.unlockMessage}>
                <Ionicons name="lock-open" size={20} color="#58CC02" />
                <Text style={styles.unlockText}>恭喜！您已完成三星挑战，下一关已解锁</Text>
              </RNView>
            )}
          </RNView>

          <Text style={styles.modalQuestion}>你想要：</Text>

          <RNView style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.retryButton]} onPress={onRetry}>
              <Text style={styles.modalButtonText}>重新做一遍</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, styles.exitButton]} onPress={onExit}>
              <Text style={styles.modalButtonText}>退出本单元</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </RNView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  summaryContainer: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  summaryDetail: {
    fontSize: 16,
    marginVertical: 4,
    color: "#555",
  },
  summaryHighlight: {
    fontWeight: "bold",
    color: "#5EC0DE",
  },
  correctCount: {
    fontWeight: "bold",
    color: "green",
  },
  incorrectCount: {
    fontWeight: "bold",
    color: "red",
  },
  modalQuestion: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  retryButton: {
    backgroundColor: "#5EC0DE",
  },
  exitButton: {
    backgroundColor: "#FF9600",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  unlockMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 204, 2, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  unlockText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#58CC02",
  },
});
