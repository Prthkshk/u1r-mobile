import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Fonts } from "../styles/typography";
import { useUser } from "../../context/UserContext";
import { fetchOrders, cancelOrder } from "../../services/orderService";
import { useFocusEffect } from "@react-navigation/native";

const placeholder = require("../../assets/images/placeholder.png");
const icons = {
  DELIVERED: require("../../assets/icons/delivered.png"),
  CANCELLED: require("../../assets/icons/cancelled.png"),
  PENDING: require("../../assets/icons/pending.png"),
};

const formatPrice = (value) => `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${month} ${year}${time ? ` ${time}` : ""}`;
};

export default function MyOrders({ navigation }) {
  const { userId } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchOrders(userId);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Orders fetch error", err?.response?.data || err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = async (orderId) => {
    if (!orderId) return;
    Alert.alert("Cancel order", "Are you sure you want to cancel this order?", [
      { text: "No" },
      {
        text: "Yes",
        onPress: async () => {
          setCancellingId(orderId);
          try {
            await cancelOrder(orderId);
            await loadOrders();
          } catch (err) {
            Alert.alert("Cancel failed", "Could not cancel the order. Try again.");
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const statusMeta = useMemo(
    () => ({
      DELIVERED: {
        title: "Order Delivered",
        color: "#1AA145",
        sub: (o) => `Delivered on ${formatDate(o.deliveredAt || o.updatedAt || o.createdAt)}`,
        icon: icons.DELIVERED,
      },
      CANCELLED: {
        title: "Order Cancelled",
        color: "#E53935",
        sub: () => "Order was Cancelled",
        icon: icons.CANCELLED,
      },
      PENDING: {
        title: "Order Pending",
        color: "#FF9900",
        sub: (o) =>
          o.expectedDelivery
            ? `Expected Delivery ${o.expectedDelivery}`
            : `Placed on ${formatDate(o.createdAt)}`,
        icon: icons.PENDING,
      },
    }),
    []
  );

  const renderItems = (items = [], accent = "#1AA145") =>
    items.map((item, idx) => (
      <View key={`${item.productId || idx}-${idx}`} style={styles.itemRow}>
        <View style={[styles.bullet, { backgroundColor: accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[Fonts.bodyBold, styles.itemName]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[Fonts.body, styles.itemMeta]}>{item.weight || ""}</Text>
        </View>
        <Text style={[Fonts.bodyBold, styles.itemPrice]}>
          {formatPrice(item.price)}
        </Text>
      </View>
    ));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <LinearGradient
        colors={["#FFD6D6", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image
            source={require("../../assets/icons/arrow-left.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.heading, styles.headerTitle]}>My Orders</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF2E2E" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
          {orders.length === 0 ? (
            <Text style={[Fonts.bodyBold, styles.emptyText]}>No orders yet</Text>
          ) : (
            orders.map((order) => {
              const meta = statusMeta[order.status] || statusMeta.PENDING;
              return (
                <TouchableOpacity
                  key={order._id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("OrderSummary", { orderId: order._id })}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Image source={meta.icon || placeholder} style={styles.statusIcon} />
                      <View>
                        <Text style={[Fonts.bodyExtraBold, styles.cardTitle, { color: meta.color }]}>
                          {meta.title}
                        </Text>
                        <Text style={[Fonts.body, styles.cardSubtitle]}>
                          {meta.sub(order)}
                        </Text>
                      </View>
                    </View>
                    {order.status === "PENDING" ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleCancel(order._id);
                        }}
                        style={styles.cancelBtn}
                        disabled={cancellingId === order._id}
                      >
                        <MaterialIcons
                          name="cancel"
                          size={20}
                          color="#F24B4B"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.divider} />

                  {renderItems(order.items || [], meta.color)}

                  <View style={[styles.divider, { marginTop: 10 }]} />
                  <View style={styles.totalRow}>
                    <Text style={[Fonts.bodyBold, styles.totalLabel]}>Total Amount :</Text>
                    <Text style={[Fonts.bodyBold, styles.totalValue]}>
                      {formatPrice(order.totalAmount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { padding: 6 },
  headerIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { color: "#000" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", marginTop: 30, color: "#999" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 12,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusIcon: { width: 28, height: 28, resizeMode: "contain" },
  cardTitle: { fontSize: 15 },
  cardSubtitle: { color: "#777", marginTop: 2, maxWidth: 210 },
  divider: {
    height: 1,
    backgroundColor: "#EFEFEF",
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  itemName: { fontSize: 13, color: "#000" },
  itemMeta: { fontSize: 11, color: "#9A9A9A" },
  itemPrice: { fontSize: 13, color: "#000" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  totalLabel: { color: "#000" },
  totalValue: { color: "#000" },
  cancelBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF2F2",
    borderWidth: 1,
    borderColor: "#FFD6D6",
  },
});
