import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Fonts } from "../../styles/typography";
import { useUser } from "../../../context/UserContext";
import { getNotifications, markNotificationRead } from "../../../services/notificationService";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationsScreen({ navigation }) {
  const { userId } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await getNotifications(userId);
        setItems(data);
      } catch (error) {
        console.log("Notifications fetch error:", error?.message || error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      loadNotifications(false);
    }, [loadNotifications])
  );

  const handleOpenNotification = async (item) => {
    if (!item?._id || item?.read) return;
    try {
      await markNotificationRead(item._id);
      setItems((prev) =>
        prev.map((entry) =>
          entry._id === item._id ? { ...entry, read: true } : entry
        )
      );
    } catch (error) {
      console.log("Notification read error:", error?.message || error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.bodyBold, styles.headerTitle]}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#FF2E2E" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={[Fonts.body, styles.emptyText]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item?._id || String(index)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor="#FF2E2E"
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, !item?.read && styles.unreadCard]}
              onPress={() => handleOpenNotification(item)}
            >
              <Text style={[Fonts.bodyBold, styles.titleText]}>
                {item?.title || "Notification"}
              </Text>
              {!!item?.message && (
                <Text style={[Fonts.body, styles.messageText]}>{item.message}</Text>
              )}
              <Text style={[Fonts.body, styles.dateText]}>
                {formatDate(item?.createdAt)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  backIcon: { width: 24, height: 24, tintColor: "#222" },
  headerTitle: { fontSize: 18, color: "#111" },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#777" },
  listContent: { padding: 12, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 12,
    padding: 12,
  },
  unreadCard: {
    borderColor: "#FFD7D7",
    backgroundColor: "#FFF8F8",
  },
  titleText: { fontSize: 14, color: "#111", marginBottom: 6 },
  messageText: { fontSize: 13, color: "#4F4F4F", marginBottom: 8, lineHeight: 19 },
  dateText: { fontSize: 12, color: "#8A8A8A" },
});
