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
import { Fonts } from "../styles/typography";
import { fetchOrderDetails, cancelOrder } from "../../services/orderService";
import { useRoute } from "@react-navigation/native";
import { withBaseUrl } from "../../config/api";

const placeholder = require("../../assets/images/placeholder.png");
const statusIcons = {
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

export default function OrderSummary({ navigation }) {
  const route = useRoute();
  const orderId = route?.params?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchOrderDetails(orderId);
      setOrder(res.data || null);
    } catch (err) {
      Alert.alert("Error", "Could not load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const meta = useMemo(() => {
    const base = {
      title: "Order Summary",
      sub: "",
      color: "#000",
      icon: statusIcons.PENDING,
    };
    if (!order) return base;
    if (order.status === "DELIVERED") {
      return {
        title: "Order Delivered",
        sub: `Delivered on ${formatDate(order.deliveredAt || order.updatedAt || order.createdAt)}`,
        color: "#1AA145",
        icon: statusIcons.DELIVERED,
      };
    }
    if (order.status === "CANCELLED") {
      return {
        title: "Order Cancelled",
        sub: "Order was Cancelled",
        color: "#E53935",
        icon: statusIcons.CANCELLED,
      };
    }
    return {
      title: "Order Pending",
      sub: order.expectedDelivery
        ? `Expected Delivery ${order.expectedDelivery}`
        : `Placed on ${formatDate(order.createdAt)}`,
      color: "#FF9900",
      icon: statusIcons.PENDING,
    };
  }, [order]);

  const itemsTotal = useMemo(() => {
    if (!order) return 0;
    const delivery = Number(order.deliveryCharge) || 0;
    const base = Number(order.subtotal ?? order.totalAmount ?? 0) || 0;
    return base - delivery;
  }, [order]);

  const handleCancel = async () => {
    if (!order?._id || order.status !== "PENDING") return;
    Alert.alert("Cancel order", "Are you sure you want to cancel this order?", [
      { text: "No" },
      {
        text: "Yes",
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(order._id);
            await loadOrder();
          } catch (err) {
            Alert.alert("Cancel failed", "Could not cancel the order. Try again.");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const renderItems = () =>
    (order?.items || []).map((item, idx) => (
      <View key={`${item.productId || idx}-${idx}`} style={styles.itemRow}>
        <Image
          source={
            item.image
              ? { uri: withBaseUrl(item.image) }
              : placeholder
          }
          style={styles.itemImage}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={[Fonts.bodyBold, styles.itemName]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[Fonts.body, styles.itemMeta]}>
            {(item.weight || "") + (item.quantity ? ` x ${item.quantity}` : "")}
          </Text>
        </View>
        <Text style={[Fonts.bodyBold, styles.itemPrice]}>
          {formatPrice(item.price)}
        </Text>
      </View>
    ));

  const renderAddress = () => {
    if (!order?.address) return null;
    const a = order.address;
    return (
      <>
        <Text style={[Fonts.bodyBold, styles.detailLabel]}>Deliver to</Text>
        <Text style={[Fonts.body, styles.detailValue]}>
          {[
            a.name,
            a.address,
            a.city,
            a.state,
            a.pincode,
          ]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </>
    );
  };

  const repeatOrder = () => {
    navigation.navigate("HomeTabs", { screen: "HomeB2B" });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image
            source={require("../../assets/icons/arrow-left.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.heading, styles.headerTitle]}>Order Summary</Text>
        {order?.status === "PENDING" ? (
          <TouchableOpacity onPress={handleCancel} style={styles.headerBtn} disabled={cancelling}>
            <Image
              source={require("../../assets/icons/cancel.png")}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF2E2E" />
        </View>
      ) : !order ? (
        <View style={styles.loader}>
          <Text style={[Fonts.bodyBold, { color: "#000" }]}>Order not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Image source={meta.icon} style={styles.statusIcon} />
              <View>
                <Text style={[Fonts.bodyExtraBold, styles.summaryTitle, { color: meta.color }]}>
                  {meta.title}
                </Text>
                <Text style={[Fonts.body, styles.summarySub]}>{meta.sub}</Text>
                <TouchableOpacity>
                  <Text style={[Fonts.bodyBold, styles.downloadText]}>
                    Download Invoice ⬇️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[Fonts.bodyBold, styles.sectionLabel]}>
              {order.items?.length || 0} items in this order
            </Text>

            {renderItems()}
          </View>

          <View style={styles.billSection}>
            <Text style={[Fonts.bodyExtraBold, styles.billTitle]}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items Total</Text>
              <Text style={styles.billValue}>
                {formatPrice(itemsTotal)}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery</Text>
              <Text style={[styles.billValue, order.deliveryCharge === 0 && styles.deliveryFree]}>
                {order.deliveryCharge === 0 ? "FREE" : formatPrice(order.deliveryCharge)}
              </Text>
            </View>
            <View style={[styles.billRow, styles.billTotalRow]}>
              <Text style={[styles.billLabel, styles.billTotalLabel]}>Bill Total</Text>
              <Text style={[styles.billValue, styles.billTotalValue]}>
                {formatPrice(order.totalAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[Fonts.bodyBold, styles.sectionLabel]}>Order Details</Text>
            <Text style={[Fonts.bodyBold, styles.detailLabel]}>Order id</Text>
            <Text style={[Fonts.body, styles.detailValue]}>{order._id}</Text>

            <Text style={[Fonts.bodyBold, styles.detailLabel, { marginTop: 8 }]}>Payment</Text>
            <Text style={[Fonts.body, styles.detailValue]}>Paid</Text>

            <View style={{ marginTop: 8 }}>
              {renderAddress()}
            </View>

            <Text style={[Fonts.bodyBold, styles.detailLabel, { marginTop: 8 }]}>Order placed</Text>
            <Text style={[Fonts.body, styles.detailValue]}>{formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Image source={require("../../assets/icons/support.png")} style={styles.helpIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[Fonts.bodyBold, styles.helpTitle]}>
                  Need help with your order ?
                </Text>
                <TouchableOpacity style={styles.contactRow}>
                  <Text style={[Fonts.bodyBold, styles.contactText]}>Contact Support</Text>
                  <Text style={[Fonts.body, styles.contactSub]}>
                    Feel free to contact us related to your order
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.repeatWrap}>
            <TouchableOpacity style={styles.repeatBtn} onPress={repeatOrder}>
              <Text style={[Fonts.bodyBold, styles.repeatText]}>Repeat Order</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  headerBtn: { padding: 6 },
  headerIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { color: "#000" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  summaryCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 8,
    borderColor: "#F5F5F5",
  },
  summaryHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  statusIcon: { width: 32, height: 32, resizeMode: "contain" },
  summaryTitle: { fontSize: 16 },
  summarySub: { color: "#777", marginTop: 2, marginBottom: 4 },
  downloadText: { color: "#1AA145", marginTop: 2 },
  sectionLabel: { fontSize: 13, color: "#000", marginTop: 12, marginBottom: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  itemImage: { width: 46, height: 46, borderRadius: 8, backgroundColor: "#fafafa" },
  itemName: { fontSize: 13, color: "#000" },
  itemMeta: { fontSize: 12, color: "#777", marginTop: 2 },
  itemPrice: { fontSize: 13, color: "#000" },
  section: {
    backgroundColor: "#fff",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  billSection: {
    backgroundColor: "#fff",
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  billTitle: { fontSize: 18, color: "#2E2E2E", marginBottom: 16 },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  billLabel: { fontSize: 16, color: "#111" },
  billValue: { fontSize: 18, color: "#000" },
  deliveryFree: { color: "#00A850", fontSize: 18 },
  billTotalRow: { marginTop: 8 },
  billTotalLabel: { fontSize: 18, color: "#2E2E2E" },
  billTotalValue: { fontSize: 20, color: "#000" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  billLabel: { color: "#000", fontSize: 13 },
  billValue: { color: "#000", fontSize: 13 },
  billTotalRow: { marginTop: 10 },
  billTotalLabel: { fontWeight: "700" },
  billTotalValue: { fontWeight: "700" },
  detailLabel: { color: "#000", fontSize: 12 },
  detailValue: { color: "#555", marginTop: 2 },
  helpCard: {
    backgroundColor: "#fff",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  helpHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  helpIcon: { width: 32, height: 32, resizeMode: "contain" },
  helpTitle: { color: "#000" },
  contactRow: { marginTop: 6 },
  contactText: { color: "#000" },
  contactSub: { color: "#777", marginTop: 2 },
  repeatWrap: { paddingHorizontal: 14, paddingVertical: 16, backgroundColor: "#fff" },
  repeatBtn: {
    backgroundColor: "#10A14C",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  repeatText: { color: "#fff", fontSize: 15 },
});
