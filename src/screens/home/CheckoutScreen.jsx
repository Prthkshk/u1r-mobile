import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import { useUser } from "../../context/UserContext";
import { Fonts } from "../styles/typography";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

export default function CheckoutScreen({ navigation, route }) {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { userId, phone } = useUser();
  const [selectedAddress, setSelectedAddress] = useState(
    route?.params?.selectedAddress || null
  );
  const [placing, setPlacing] = useState(false);
  const numericTotal = Number(totalAmount) || 0;
  const isDeliveryFree = numericTotal >= 200000;
  const deliveryCharge = isDeliveryFree ? 0 : 1000;

  useEffect(() => {
    const incoming = route?.params?.selectedAddress;
    if (incoming) {
      setSelectedAddress(incoming);
    }
  }, [route?.params?.selectedAddress]);

  useEffect(() => {
    if (selectedAddress) return;

    AsyncStorage.getItem(addressKey)
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed) setSelectedAddress(parsed);
        }
      })
      .catch(() => {});
  }, [selectedAddress, addressKey]);

  const totalQuantity = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cartItems]
  );

  const billTotal = useMemo(() => numericTotal + deliveryCharge, [numericTotal, deliveryCharge]);

  const formatPrice = (value) =>
    `\u20b9${(Number(value) || 0).toLocaleString("en-IN")}`;

  const addressKey = useMemo(() => `selectedAddress_${userId || "guest"}`, [userId]);

  const syncCartToBackend = async (userId) => {
    // Push local cart to backend cart so the order API can pick it up
    for (const item of cartItems) {
      if (!item.id) continue;
      await axios.post(`${API_BASE_URL}/api/cart/add`, {
        userId,
        productId: item.id,
      });
      await axios.post(`${API_BASE_URL}/api/cart/update`, {
        userId,
        productId: item.id,
        quantity: Number(item.qty) || 1,
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (placing) return;
    if (cartItems.length === 0) {
      Alert.alert("Cart empty", "Add some items before placing an order.");
      return;
    }
    if (!selectedAddress) {
      Alert.alert("Select address", "Please choose a delivery address to continue.");
      return;
    }

    const resolvedUserId = userId;
    if (!resolvedUserId) {
      Alert.alert("User not found", "Please login again to place the order.");
      return;
    }

    try {
      setPlacing(true);

      await syncCartToBackend(resolvedUserId);

      await axios.post(`${API_BASE_URL}/api/orders/place-order`, {
        userId: resolvedUserId,
        address: selectedAddress,
      });

      clearCart();
      navigation.navigate("OrderSuccess");
    } catch (err) {
      console.log("Place order error", err?.response?.data || err?.message);
      Alert.alert("Order failed", "Could not place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require("../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.heading, styles.headerTitle]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        style={{ flex: 1 }}
      >
        <View style={styles.locationCard}>
          <View style={styles.locationIconWrap}>
            <Image
              source={require("../../assets/icons/location.png")}
              style={styles.locationIcon}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[Fonts.bodyBold, styles.locationLabel]}>
              Delivering to :-
            </Text>
            {selectedAddress ? (
              <>
                <Text style={[Fonts.bodyBold, styles.locationName]}>
                  {selectedAddress.name}
                </Text>
                <Text style={[Fonts.body, styles.locationLine]}>
                  {[
                    selectedAddress.addressLine,
                    selectedAddress.city,
                    selectedAddress.state,
                    selectedAddress.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                <Text style={[Fonts.bodyBold, styles.phoneLabel]}>
                  Phone Number :{" "}
                  <Text style={[Fonts.body, styles.phoneValue]}>
                    {selectedAddress.phone}
                  </Text>
                </Text>
              </>
            ) : (
              <View style={{ gap: 6 }}>
                <Text style={[Fonts.body, styles.locationMissing]}>
                  No address selected yet.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddressBook")}
                  style={styles.selectAddressBtn}
                >
                  <Text style={[Fonts.bodyBold, styles.selectAddressText]}>
                    Choose Address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <Text style={[Fonts.bodyBold, styles.sectionTitle]}>
          {totalQuantity} item{totalQuantity === 1 ? "" : "s"} in this order
        </Text>

        <View style={{ gap: 10 }}>
          {cartItems.map((item) => {
            const lineTotal =
              (Number(item.price) || 0) * (Number(item.qty) || 0);

            return (
              <View key={item.id} style={styles.orderCard}>
                <Image
                  source={
                    typeof item.image === "string"
                      ? {
                          uri: withBaseUrl(item.image),
                        }
                      : item.image || require("../../assets/images/placeholder.png")
                  }
                  style={styles.orderImage}
                />

                <View style={{ flex: 1 }}>
                  <View style={styles.orderHeader}>
                    <Text
                      style={[Fonts.bodyBold, styles.productName]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[Fonts.bodyBold, styles.unitPrice]}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[Fonts.body, styles.metaText]}>
                    {item.weight || "1 Kg"} x {item.qty}
                  </Text>

                  <Text style={[Fonts.bodyBold, styles.lineTotal]}>
                    {formatPrice(lineTotal)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.billCard}>
          <Text style={[Fonts.bodyExtraBold, styles.billTitle]}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={[Fonts.bodyBold, styles.billLabel]}>Items Total</Text>
            <Text style={[Fonts.bodyExtraBold, styles.billValue]}>
              {formatPrice(numericTotal)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[Fonts.bodyBold, styles.billLabel]}>Delivery</Text>
            <Text
              style={[
                Fonts.bodyExtraBold,
                isDeliveryFree ? styles.deliveryFree : styles.billValue,
              ]}
            >
              {isDeliveryFree ? "FREE" : formatPrice(deliveryCharge)}
            </Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={[Fonts.bodyExtraBold, styles.billTotalLabel]}>
              Bill Total
            </Text>
            <Text style={[Fonts.bodyExtraBold, styles.billTotalValue]}>
              {formatPrice(billTotal)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={[Fonts.bodyExtraBold, styles.bottomTotal]}>
            {formatPrice(billTotal)}
          </Text>
          <Text style={[Fonts.bodyBold, styles.viewBill]}>View Bill Details</Text>
        </View>

        <TouchableOpacity
          style={styles.orderButton}
          activeOpacity={0.9}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          <Text style={[Fonts.bodyBold, styles.orderButtonText]}>
            {placing ? "Placing..." : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },
  backBtn: { padding: 6 },
  backIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { fontSize: 18, color: "#000" },

  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDEDED",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFE7E7",
    alignItems: "center",
    justifyContent: "center",
  },
  locationIcon: { width: 24, height: 24, resizeMode: "contain" },
  locationLabel: { fontSize: 13, color: "#000" },
  locationName: { fontSize: 15, color: "#000", marginTop: 2 },
  locationLine: { fontSize: 12, color: "#505050", marginTop: 4 },
  phoneLabel: { fontSize: 12, color: "#000", marginTop: 8 },
  phoneValue: { fontSize: 12, color: "#777" },
  locationMissing: { fontSize: 12, color: "#7A7A7A" },
  selectAddressBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE7E7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectAddressText: { color: "#F24B4B", fontSize: 12 },

  sectionTitle: {
    fontSize: 14,
    color: "#000",
    marginBottom: 12,
  },

  orderCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 12,
  },
  orderImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  productName: { fontSize: 13, color: "#000", flex: 1 },
  unitPrice: { fontSize: 13, color: "#000" },
  metaText: { fontSize: 12, color: "#7B7B7B", marginTop: 6 },
  lineTotal: {
    fontSize: 16,
    color: "#000",
    marginTop: 8,
  },

  billCard: {
    marginTop: 22,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 16,
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
  deliveryFree: { fontSize: 18, color: "#00A850" },
  billDivider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 8,
  },
  billTotalLabel: { fontSize: 18, color: "#2E2E2E" },
  billTotalValue: { fontSize: 20, color: "#000" },

  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#EDEDED",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomTotal: { fontSize: 18, color: "#000" },
  viewBill: { fontSize: 12, color: "#F24B4B", marginTop: 2 },
  orderButton: {
    backgroundColor: "#FF3B3B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 130,
    alignItems: "center",
  },
  orderButtonText: { color: "#fff", fontSize: 15 },
});
