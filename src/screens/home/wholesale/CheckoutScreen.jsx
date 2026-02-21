import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useCart } from "../../../context/CartContext";
import { useUser } from "../../../context/UserContext";
import { Fonts } from "../../styles/typography";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import BillIcon from "../../../assets/icons/bill.svg";
import DiscountMrpIcon from "../../../assets/icons/discountmrp.svg";

const pickNumber = (...values) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
};

const getPrices = (item) => {
  const sale = pickNumber(
    item?.discountPrice,
    item?.salePrice,
    item?.sellingPrice,
    item?.retailPrice,
    item?.price,
    item?.moqPrice,
    item?.mrp,
    item?.oldPrice
  );
  const mrp = pickNumber(item?.mrp, item?.oldPrice, item?.retailMrp, item?.price);
  return { sale, mrp: mrp > sale ? mrp : null };
};
const isValidObjectId = (value = "") => /^[a-fA-F0-9]{24}$/.test(String(value));

export default function CheckoutScreen({ navigation, route }) {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { userId, phone, mode } = useUser();
  const [selectedAddress, setSelectedAddress] = useState(
    route?.params?.selectedAddress || null
  );
  const [placing, setPlacing] = useState(false);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [weightMap, setWeightMap] = useState({});
  const numericTotal = Number(totalAmount) || 0;

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
  const totalWeightKg = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const label = String(item?.weight || "").trim();
      const kg = weightMap[label];
      if (!kg) return sum;
      return sum + Number(kg) * (Number(item.qty) || 0);
    }, 0);
  }, [cartItems, weightMap]);

  const isRetailMode = mode === "retail";
  const mrpTotal = useMemo(() => {
    if (!isRetailMode) return numericTotal;
    return cartItems.reduce((sum, item) => {
      const parsed = getPrices(item);
      const mrpOrSale = Number(parsed.mrp ?? parsed.sale) || 0;
      return sum + mrpOrSale * (Number(item.qty) || 0);
    }, 0);
  }, [cartItems, isRetailMode, numericTotal]);
  const discountOnMrp = useMemo(
    () => Math.max(0, mrpTotal - numericTotal),
    [mrpTotal, numericTotal]
  );
  const deliveryFee = useMemo(
    () => (isRetailMode || totalWeightKg >= 300 ? 0 : 1000),
    [isRetailMode, totalWeightKg]
  );
  const billTotal = useMemo(
    () => numericTotal + deliveryFee,
    [numericTotal, deliveryFee]
  );

  const formatPrice = (value) =>
    `\u20b9${(Number(value) || 0).toLocaleString("en-IN")}`;
  const formatWeight = (value) => {
    const num = Number(value) || 0;
    return `${num.toFixed(2)} kg`;
  };

  const addressKey = useMemo(() => `selectedAddress_${userId || "guest"}`, [userId]);

  useEffect(() => {
    const fetchWeights = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/public/weights`, {
          params: { mode: "wholesale" },
        });
        const incoming = res.data || [];
        const map = {};
        if (Array.isArray(incoming)) {
          incoming.forEach((item) => {
            const label = String(item?.label || "").trim();
            const kg = Number(item?.kg);
            if (!label || !Number.isFinite(kg)) return;
            map[label] = kg;
          });
        }
        setWeightMap(map);
      } catch (err) {
        console.log("WEIGHTS LOAD ERROR:", err?.response?.data || err?.message);
      }
    };
    fetchWeights();
  }, []);
  const syncCartToBackend = async (userId) => {
    // Push local cart to backend cart so the order API can pick it up
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of cartItems) {
      const productId = String(item?._id || item?.id || item?.productId || "");
      if (!isValidObjectId(productId)) {
        failedCount += 1;
        continue;
      }
      try {
        await axios.post(`${API_BASE_URL}/api/cart/add`, {
          userId,
          productId,
        });
        await axios.post(`${API_BASE_URL}/api/cart/update`, {
          userId,
          productId,
          quantity: Number(item.qty) || 1,
        });
        syncedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    return { syncedCount, failedCount };
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

    const resolvedUserId = String(userId || "");
    if (!isValidObjectId(resolvedUserId)) {
      Alert.alert("User not found", "Please login again to place the order.");
      return;
    }

    try {
      setPlacing(true);

      const { syncedCount } = await syncCartToBackend(resolvedUserId);
      if (syncedCount === 0) {
        Alert.alert("Order failed", "Items in cart are unavailable. Please refresh your cart and try again.");
        return;
      }

      const normalizedAddress = {
        ...selectedAddress,
        address:
          selectedAddress?.address ||
          selectedAddress?.addressLine ||
          "",
      };

      await axios.post(`${API_BASE_URL}/api/orders/place-order`, {
        userId: resolvedUserId,
        address: normalizedAddress,
        mode: isRetailMode ? "retail" : "wholesale",
      });

      clearCart(isRetailMode ? "retail" : "wholesale");
      navigation.navigate("OrderSuccess");
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || err?.message || "Could not place your order. Please try again.";
      console.log("Place order error", err?.response?.data || err?.message);
      Alert.alert("Order failed", backendMessage);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
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
              source={require("../../../assets/icons/location.png")}
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
        {mode === "wholesale" && (
          <Text style={[Fonts.body, styles.quantityLine]}>
            Total Weight: {formatWeight(totalWeightKg)}
          </Text>
        )}

        <View style={{ gap: 10 }}>
          {cartItems.map((item) => {
            const parsed = getPrices(item);
            const sale = isRetailMode
              ? parsed.sale
              : Number(item?.price) || 0;
            const mrp = isRetailMode ? parsed.mrp : null;
            const lineTotal =
              (Number(sale) || 0) * (Number(item.qty) || 0);

            return (
              <View key={item.id} style={styles.orderCard}>
                <Image
                  source={(() => {
                    if (typeof item.image === "string") {
                      const trimmed = item.image.trim();
                      if (!trimmed || trimmed.toLowerCase().includes("placeholder")) {
                        return require("../../../assets/images/placeholder.png");
                      }
                      return { uri: withBaseUrl(trimmed) };
                    }
                    return item.image || require("../../../assets/images/placeholder.png");
                  })()}
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
                        {formatPrice(sale)}
                      </Text>
                      {!!mrp && (
                        <Text style={styles.unitMrp}>
                          {formatPrice(mrp)}
                        </Text>
                      )}
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
          <Text style={[Fonts.bodyBold, styles.billTitle]}>Bill Details</Text>

          <View style={styles.billRow}>
            <View style={styles.billLabelRow}>
              <BillIcon width={14} height={14} fill="#222" />
              <Text style={[Fonts.body, styles.billLabel]}>MRP</Text>
            </View>
            <Text style={[Fonts.body, styles.billValue]}>
              {formatPrice(mrpTotal)}
            </Text>
          </View>

          {isRetailMode && (
            <View style={styles.billRow}>
              <View style={styles.billLabelRow}>
                <DiscountMrpIcon width={14} height={14} />
                <Text style={[Fonts.body, styles.billLabel]}>Discount On MRP</Text>
              </View>
              <Text style={[Fonts.bodyBold, styles.discountValue]}>
                -{formatPrice(discountOnMrp)}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <View>
              <View style={styles.billLabelRow}>
                <Image
                  source={require("../../../assets/icons/delivery.png")}
                  style={styles.billRowIcon}
                />
                <Text style={[Fonts.body, styles.billLabel]}>Delivery</Text>
              </View>
              {!isRetailMode && deliveryFee > 0 && (
                <Text style={[Fonts.body, styles.deliveryNote]}>
                  (Delivery free on cart weight above 300Kg)
                </Text>
              )}
            </View>
            <Text
              style={[
                Fonts.bodyBold,
                styles.billValue,
                deliveryFee === 0 && styles.freeText,
              ]}
            >
              {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
            </Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={[Fonts.bodyBold, styles.billTotalLabel]}>
              Bill Total
            </Text>
            <Text style={[Fonts.bodyBold, styles.billTotalValue]}>
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
          <TouchableOpacity
            onPress={() => setBillModalVisible((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[Fonts.bodyBold, styles.viewBill]}>View Bill Details</Text>
          </TouchableOpacity>
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

      <Modal
        visible={billModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBillModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setBillModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={[Fonts.bodyBold, styles.modalTitle]}>Bill Details</Text>
            </View>

            <View style={styles.billRow}>
              <View style={styles.billLabelRow}>
                <BillIcon width={14} height={14} fill="#222" />
                <Text style={[Fonts.body, styles.billLabel]}>MRP</Text>
              </View>
              <Text style={[Fonts.body, styles.billValue]}>{formatPrice(mrpTotal)}</Text>
            </View>

            {isRetailMode && (
              <View style={styles.billRow}>
                <View style={styles.billLabelRow}>
                  <DiscountMrpIcon width={14} height={14} />
                  <Text style={[Fonts.body, styles.billLabel]}>Discount On MRP</Text>
                </View>
                <Text style={[Fonts.bodyBold, styles.discountValue]}>
                  -{formatPrice(discountOnMrp)}
                </Text>
              </View>
            )}

            <View style={styles.billRow}>
              <View>
                <View style={styles.billLabelRow}>
                  <Image
                    source={require("../../../assets/icons/delivery.png")}
                    style={styles.billRowIcon}
                  />
                  <Text style={[Fonts.body, styles.billLabel]}>Delivery</Text>
                </View>
                {!isRetailMode && deliveryFee > 0 && (
                  <Text style={[Fonts.body, styles.deliveryNote]}>
                    (Delivery free on cart weight above 300Kg)
                  </Text>
                )}
              </View>
              <Text
                style={[
                  Fonts.bodyBold,
                  styles.billValue,
                  deliveryFee === 0 && styles.freeText,
                ]}
              >
                {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
              </Text>
            </View>

            <View style={styles.billDivider} />

            <View style={[styles.billRow, { marginBottom: 0 }]}>
              <Text style={[Fonts.bodyBold, styles.billTotalLabel]}>Bill Total</Text>
              <Text style={[Fonts.bodyBold, styles.billTotalValue]}>{formatPrice(billTotal)}</Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  quantityLine: {
    fontSize: 12,
    color: "#7B7B7B",
    marginTop: -6,
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
  unitMrp: { fontSize: 11, color: "#999", textDecorationLine: "line-through" },
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
  billTitle: { fontSize: 16, color: "#222", marginBottom: 12 },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  billLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  billRowIcon: { width: 14, height: 14, tintColor: "#222", resizeMode: "contain" },
  billLabel: { fontSize: 14, color: "#111" },
  billValue: { fontSize: 14, color: "#000" },
  discountValue: { fontSize: 14, color: "#16a34a" },
  freeText: { color: "#16a34a" },
  deliveryNote: { fontSize: 11, color: "#7B7B7B", marginTop: 2 },
  billDivider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 10 },
  billTotalLabel: { fontSize: 16, color: "#111" },
  billTotalValue: { fontSize: 16, color: "#000" },

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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, color: "#111" },
});
