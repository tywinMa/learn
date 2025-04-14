import { StyleSheet, ScrollView, Image } from "react-native";
import { Text, View } from "../../components/Themed";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useState } from "react";

const CARD_DATA = [
  {
    id: "1",
    title: "开始使用",
    content: "欢迎使用跨平台移动应用脚手架。这个应用模板支持 iOS 和 Android，使用 React Native 和 Expo 构建。",
    icon: "rocket",
  },
  {
    id: "2",
    title: "功能特点",
    content: "内置主题支持、路由导航、组件库，方便你快速构建功能齐全的移动应用。",
    icon: "star",
  },
  {
    id: "3",
    title: "开发与调试",
    content: "你可以使用 Expo Go 应用预览，或在浏览器中调试大部分功能。",
    icon: "code-slash",
  },
  {
    id: "4",
    title: "发布上架",
    content: "一次构建，随处运行。支持同时发布到 App Store 和 Google Play 商店。",
    icon: "cloud-upload",
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [likedCards, setLikedCards] = useState<string[]>([]);

  const toggleLike = (id: string) => {
    if (likedCards.includes(id)) {
      setLikedCards(likedCards.filter((cardId) => cardId !== id));
    } else {
      setLikedCards([...likedCards, id]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>跨平台应用模板</Text>
        <Text style={styles.subtitle}>快速构建 iOS 和 Android 应用</Text>
      </View>

      <View style={styles.bannerContainer}>
        <Image source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }} style={styles.bannerImage} />
        <View style={styles.overlay}>
          <Text style={styles.bannerText}>使用 React Native 和 Expo</Text>
          <Button
            title="了解更多"
            size="small"
            onPress={() => {}}
            icon={<Ionicons name="information-circle" size={16} color="#fff" />}
          />
        </View>
      </View>

      <View style={styles.cardsContainer}>
        {CARD_DATA.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            style={styles.card}
            footer={
              <View style={styles.cardFooter}>
                <Button title="详情" type="outline" size="small" onPress={() => {}} />
                <Ionicons
                  name={likedCards.includes(card.id) ? "heart" : "heart-outline"}
                  size={24}
                  color={likedCards.includes(card.id) ? "#ff3b30" : Colors[colorScheme].text}
                  onPress={() => toggleLike(card.id)}
                />
              </View>
            }
          >
            <View style={styles.cardContent}>
              <Ionicons name={card.icon} size={32} color={Colors[colorScheme].tint} style={styles.cardIcon} />
              <Text style={styles.cardText}>{card.content}</Text>
            </View>
          </Card>
        ))}
      </View>

      <Button title="开始创建" type="primary" size="large" fullWidth onPress={() => {}} style={styles.ctaButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  bannerContainer: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  cardIcon: {
    marginRight: 12,
  },
  cardText: {
    flex: 1,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  ctaButton: {
    marginVertical: 16,
  },
});
