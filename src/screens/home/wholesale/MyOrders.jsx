import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Fonts } from "../../styles/typography";
import { useUser } from "../../../context/UserContext";
import { fetchOrders, cancelOrder } from "../../../services/orderService";
import { useFocusEffect } from "@react-navigation/native";
import DispatchedIcon from "../../../assets/icons/dispatched.svg";

const placeholder = require("../../../assets/images/placeholder.png");
const icons = {
  DELIVERED: require("../../../assets/icons/delivered.png"),
  CANCELLED: require("../../../assets/icons/cancelled.png"),
  PENDING: require("../../../assets/icons/pending.png"),
};

const formatPrice = (value) => `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

const normalizeOrderStatus = (status) => {
  const value = String(status || "").trim().toUpperCase();
  if (value === "SHIPPED" || value === "DISPATCH") return "DISPATCHED";
  if (value === "DISPATCHED" || value === "DELIVERED" || value === "CANCELLED") {
    return value;
  }
  return "PENDING";
};

const formatDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${month} ${year}${time ? ` ${time}` : ""}`;
};

export default function MyOrders({ navigation, modeOverride }) {
  const { userId, mode } = useUser();
  const effectiveMode = modeOverride || mode || "wholesale";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmOrderId, setConfirmOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchOrders(
        userId,
        effectiveMode === "retail" ? "retail" : "wholesale"
      );
      let incoming = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      if (incoming.length === 0) {
        const fallbackRes = await fetchOrders(userId);
        incoming = Array.isArray(fallbackRes?.data)
          ? fallbackRes.data
          : Array.isArray(fallbackRes?.data?.data)
          ? fallbackRes.data.data
          : [];
      }
      setOrders(incoming);
    } catch (err) {
      console.log("Orders fetch error", err?.response?.data || err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId, effectiveMode]);

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
    setConfirmOrderId(orderId);
  };

  const confirmCancel = async () => {
    if (!confirmOrderId) return;
    const orderId = confirmOrderId;
    setConfirmOrderId(null);
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      await loadOrders();
    } catch (err) {
      // keep default alert for failure
      console.log("Cancel failed", err?.response?.data || err?.message);
    } finally {
      setCancellingId(null);
    }
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
      DISPATCHED: {
        title: "Order Dispatched",
        color: "#1E88E5",
        sub: (o) =>
          o.expectedDelivery
            ? `Expected Delivery ${formatDate(o.expectedDelivery)}`
            : `Dispatched on ${formatDate(o.dispatchedAt || o.updatedAt || o.createdAt)}`,
        icon: "DISPATCHED",
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }} edges={["bottom"]}>
      <LinearGradient
        colors={["#FFD6D6", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
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
              const normalizedStatus = normalizeOrderStatus(order?.status);
              const meta = statusMeta[normalizedStatus] || statusMeta.PENDING;
              return (
                <TouchableOpacity
                  key={order._id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("OrderSummary", { orderId: order._id })}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      {normalizedStatus === "DISPATCHED" ? (
                        <DispatchedIcon width={28} height={28} />
                      ) : (
                        <Image source={meta.icon || placeholder} style={styles.statusIcon} />
                      )}
                      <View>
                        <Text style={[Fonts.bodyExtraBold, styles.cardTitle, { color: meta.color }]}>
                          {meta.title}
                        </Text>
                        <Text style={[Fonts.body, styles.cardSubtitle]}>
                          {meta.sub(order)}
                        </Text>
                      </View>
                    </View>
                    {normalizedStatus === "PENDING" ? (
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

      <Modal
        visible={!!confirmOrderId}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOrderId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[Fonts.bodyExtraBold, styles.modalTitle]}>
              Are you sure you want to{"\n"}cancel this order
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnOutline}
                onPress={() => setConfirmOrderId(null)}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnOutlineText]}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={confirmCancel}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnPrimaryText]}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  modalTitle: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },
  modalBtnOutline: {
    borderWidth: 1,
    borderColor: "#FF2E2E",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 26,
    backgroundColor: "#fff",
  },
  modalBtnOutlineText: { color: "#FF2E2E", fontSize: 16 },
  modalBtnPrimary: {
    backgroundColor: "#FF2E2E",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 26,
  },
  modalBtnPrimaryText: { color: "#fff", fontSize: 16 },
});
