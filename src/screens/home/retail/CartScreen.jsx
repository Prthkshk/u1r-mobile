import React, { useEffect, useMemo, useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../../context/CartContext";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "../../styles/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../../../context/UserContext";
import axios from "axios";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import DeleteIcon from "../../../assets/icons/delete.svg";

const placeholder = require("../../../assets/images/placeholder.png");

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

export default function CartScreen({ navigation, route }) {
  const { cartItems, addToCart, incrementItem, decrementItem, removeFromCart, totalAmount } =
    useCart();
  const { userId } = useUser();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const mode = "retail";
  const addressKey = useMemo(() => `selectedAddress_${userId || "guest"}`, [userId]);

  useEffect(() => {
    const incoming = route?.params?.selectedAddress;
    if (incoming) {
      setSelectedAddress(incoming);
      AsyncStorage.setItem(addressKey, JSON.stringify(incoming)).catch(() => {});
      navigation.setParams({ selectedAddress: null });
    }
  }, [route?.params?.selectedAddress, navigation, addressKey]);

  useEffect(() => {
    AsyncStorage.getItem(addressKey)
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed) setSelectedAddress(parsed);
        }
      })
      .catch(() => {});
  }, [addressKey]);

  useEffect(() => {
    if (!cartItems.length) {
      setSimilarProducts([]);
      setSimilarLoading(false);
      return;
    }

    const fetchSimilar = async () => {
      try {
        setSimilarLoading(true);
        const cartIds = Array.from(
          new Set(
            cartItems
              .map((item) => item._id || item.id)
              .filter(Boolean)
          )
        );

        if (!cartIds.length) {
          setSimilarProducts([]);
          setSimilarLoading(false);
          return;
        }

        const limitedIds = cartIds.slice(0, 6);
        const responses = await Promise.all(
          limitedIds.map((id) =>
            axios.get(`${API_BASE_URL}/api/public/products/similar/${id}`, {
              params: { mode },
            })
          )
        );

        const seen = new Set(cartIds);
        const merged = [];

        responses.forEach((res) => {
          const list = Array.isArray(res?.data)
            ? res.data
            : res?.data?.data || res?.data?.products || [];
          if (!Array.isArray(list)) return;
          list.forEach((product) => {
            const pid = product._id || product.id;
            if (!pid || seen.has(pid)) return;
            if (merged.find((p) => (p._id || p.id) === pid)) return;
            merged.push({ ...product, id: pid });
          });
        });

        if (merged.length === 0 && limitedIds.length > 0) {
          try {
            const recommendedRes = await axios.get(
              `${API_BASE_URL}/api/public/products/recommended/${limitedIds[0]}`,
              { params: { mode } }
            );
            const recommendedList = Array.isArray(recommendedRes?.data)
              ? recommendedRes.data
              : recommendedRes?.data?.data || recommendedRes?.data?.products || [];
            recommendedList.forEach((product) => {
              const pid = product._id || product.id;
              if (!pid || seen.has(pid)) return;
              if (merged.find((p) => (p._id || p.id) === pid)) return;
              merged.push({ ...product, id: pid });
            });
          } catch {
            // keep similar results only
          }
        }

        setSimilarProducts(merged.slice(0, 10));
      } catch (error) {
        console.log("CART SIMILAR PRODUCTS ERROR:", error);
        setSimilarProducts([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilar();
  }, [cartItems]);

  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

  const normalizeImage = (uri) => (uri ? withBaseUrl(uri) : null);

  const getImageUri = (item) => {
    if (!item) return null;

    const candidates = [];
    if (typeof item.image === "string") candidates.push(item.image);
    if (typeof item.image?.url === "string") candidates.push(item.image.url);
    if (typeof item.image?.secure_url === "string") candidates.push(item.image.secure_url);
    if (typeof item.imageUrl === "string") candidates.push(item.imageUrl);
    if (Array.isArray(item.images)) {
      item.images.forEach((img) => {
        if (typeof img === "string") candidates.push(img);
        else if (typeof img?.url === "string") candidates.push(img.url);
        else if (typeof img?.secure_url === "string") candidates.push(img.secure_url);
      });
    }

    return candidates.find(Boolean) || null;
  };

  const getImageSource = (item) => {
    const uri = getImageUri(item);
    if (uri) return { uri: normalizeImage(uri) };
    if (item?.image && typeof item.image !== "string") return item.image;
    return placeholder;
  };

  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 0 }}
        >
          {/* HEADER */}
          <LinearGradient
            colors={["#FFE7E7", "#FFFFFF"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Image
                source={require("../../../assets/icons/arrow-left.png")}
                style={styles.icon}
              />
            </TouchableOpacity>

            <Text style={[Fonts.heading, styles.title]}>Cart</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Search")}
              style={styles.headerBtn}
            >
              <SearchIcon width={24} height={24} style={styles.icon} />
            </TouchableOpacity>
          </LinearGradient>

          {cartItems.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <Text style={[Fonts.body, styles.emptyText]}>
                Your cart is currently empty.
              </Text>
              <Text style={[Fonts.body, styles.emptySubText]}>
                Add some items to proceed
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.cartWrapper}>
                {selectedAddress && (
                  <TouchableOpacity
                    style={styles.addressCard}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate("AddressBook")}
                  >
                    <View style={styles.addressRow}>
                      <View style={styles.addressRadio} />
                      <View style={{ flex: 1 }}>
                        <Text style={[Fonts.bodyBold, styles.addressName]}>
                          {selectedAddress.name}
                        </Text>
                        <Text style={[Fonts.body, styles.addressLine]}>
                          {[selectedAddress.addressLine, selectedAddress.city, selectedAddress.state, selectedAddress.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                        <Text style={[Fonts.bodyBold, styles.addressPhoneLabel]}>
                          Phone Number :{" "}
                          <Text style={[Fonts.body, styles.addressPhone]}>
                            {selectedAddress.phone}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {cartItems.map((item) => {
                  const canDecrement = (Number(item.qty) || 0) > 0;
                  const { sale, mrp } = getPrices(item);
                  return (
                    <View key={item.id} style={styles.cartCard}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.cardTouch}
                        onPress={() =>
                          navigation.navigate("ProductDetail", {
                            product: item,
                            mode,
                          })
                        }
                      >
                        <Image
                          source={getImageSource(item)}
                          style={styles.productImg}
                        />

                        <View style={{ flex: 1 }}>
                          <Text style={[Fonts.bodyBold, styles.productName]}>
                            {item.name}
                          </Text>
                          <Text style={[Fonts.body, styles.weight]}>
                            {item.weight}
                          </Text>
                          <View style={styles.priceRow}>
                            <Text style={[Fonts.bodyBold, styles.price]}>
                              {formatPrice(sale)}
                            </Text>
                            {!!mrp && (
                              <Text style={styles.priceMrp}>{formatPrice(mrp)}</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.cartActionsCol}>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                          <DeleteIcon width={20} height={20} color="#2D2D2D" />
                        </TouchableOpacity>

                        <View style={styles.qtyBox}>
                          <TouchableOpacity
                            onPress={() => decrementItem(item.id)}
                            disabled={!canDecrement}
                            style={[
                              styles.qtyBtnBox,
                              !canDecrement && styles.qtyBtnDisabled,
                            ]}
                          >
                            <Text
                              style={[
                                Fonts.bodyBold,
                                styles.qtyBtn,
                                !canDecrement && styles.qtyDisabled,
                              ]}
                            >
                              -
                            </Text>
                          </TouchableOpacity>

                          <View style={styles.qtyValueBox}>
                            <Text style={[Fonts.bodyBold, styles.qtyValue]}>
                              {item.qty}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => incrementItem(item.id)}
                            style={styles.qtyBtnBox}
                          >
                            <Text style={[Fonts.bodyBold, styles.qtyBtn]}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={[Fonts.bodyBold, styles.lineTotal]}>
                          {formatPrice((Number(sale) || 0) * item.qty)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {similarProducts.length > 0 && (
              <View style={styles.moreSection}>
                <Text style={[Fonts.bodyBold, styles.moreTitle]}>
                  More like this
                </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 12 }}
                  >
                    {similarProducts.map((item) => {
                      const { sale, mrp } = getPrices(item);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.moreCard}
                          activeOpacity={0.9}
                          onPress={() =>
                            navigation.navigate("ProductDetail", {
                              product: item,
                              mode,
                            })
                          }
                        >
                          <Image
                            source={getImageSource(item)}
                            style={styles.moreImg}
                          />

                          <View style={styles.moreInfo}>
                            <Text
                              style={[Fonts.bodyBold, styles.moreName]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={[Fonts.body, styles.moreWeight]}
                              numberOfLines={1}
                            >
                              {item.weight}
                            </Text>

                            <View style={styles.priceRow}>
                              <Text style={[Fonts.bodyBold, styles.price]}>
                                {formatPrice(sale)}
                              </Text>
                              {!!mrp && (
                                <Text style={styles.moreMrp}>{formatPrice(mrp)}</Text>
                              )}
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() =>
                              addToCart({
                                ...item,
                                price: sale,
                                id: item.id,
                                moq: getMinQty(item),
                                qty: getMinQty(item),
                              })
                            }
                          >
                            <Text style={[Fonts.bodyBold, styles.addBtnText]}>
                              Add to Cart
                            </Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
              </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          {cartItems.length > 0 && selectedAddress ? (
            <>
              <Text style={[Fonts.bodyBold, styles.totalText]}>
                {formatPrice(totalAmount)}
              </Text>
              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={() => navigation.navigate("Checkout", { selectedAddress })}
              >
                <Text style={[Fonts.bodyBold, styles.checkoutText]}>Checkout</Text>
                <Image
                  source={require("../../../assets/icons/arrow-right.png")}
                  style={styles.checkoutIcon}
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.addressBtn, cartItems.length === 0 && styles.addressBtnDisabled]}
              disabled={cartItems.length === 0}
              onPress={() => navigation.navigate("AddressBook")}
            >
              <Text style={[Fonts.bodyBold, styles.addressText]}>
                Select Address
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerBtn: { padding: 4 },
  icon: {
    width: 24,
    height: 24,
    tintColor: "#000",
  },
  title: {
    fontSize: 20,
    color: "#000",
  },

  emptyWrapper: {
    marginTop: 120,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#333",
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 15,
    color: "#444",
  },

  cartWrapper: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 0,
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 12,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addressRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 5,
    borderColor: "#F24B4B",
    marginTop: 4,
  },
  addressName: { fontSize: 14, color: "#000" },
  addressLine: { fontSize: 12, color: "#555", marginTop: 4 },
  addressPhoneLabel: { fontSize: 12, color: "#000", marginTop: 6 },
  addressPhone: { fontSize: 12, color: "#777" },

  cartCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 10,
    marginBottom: 10,
    alignItems: "stretch",
  },
  cardTouch: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  productImg: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  productName: {
    fontSize: 14,
    color: "#000",
  },
  weight: {
    marginTop: 4,
    fontSize: 12,
    color: "#7B7B7B",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  price: {
    fontSize: 14,
    color: "#000",
  },
  priceMrp: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  actionRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartActionsCol: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F24B4B",
    borderRadius: 8,
    paddingHorizontal: 6,
    backgroundColor: "#FFF6F6",
    height: 32,
  },
  qtyBtnBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtn: {
    fontSize: 16,
    color: "#F24B4B",
  },
  qtyValueBox: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F24B4B",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyValue: {
    fontSize: 15,
    color: "#000",
  },
  qtyDisabled: {
    color: "#C8C8C8",
  },
  lineTotal: {
    fontSize: 15,
    color: "#000",
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: "#2D2D2D",
    resizeMode: "contain",
  },

  moreSection: {
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 6,
    backgroundColor: "#F7F7F7",
  },
  moreTitle: {
    fontSize: 14,
    color: "#000",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  moreCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 10,
    marginRight: 12,
    height: 220,
    justifyContent: "space-between",
  },
  moreImg: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    resizeMode: "contain",
  },
  moreInfo: {
    flex: 1,
    paddingBottom: 6,
  },
  moreName: {
    fontSize: 12,
    color: "#000",
  },
  moreWeight: {
    marginTop: 4,
    fontSize: 11,
    color: "#7B7B7B",
  },
  moreMrp: {
    fontSize: 11,
    color: "#999",
    textDecorationLine: "line-through",
  },
  addBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#F24B4B",
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  addBtnText: {
    color: "#F24B4B",
    fontSize: 11,
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addressBtn: {
    width: "100%",
    marginTop: 4,
    backgroundColor: "#F24B4B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addressBtnDisabled: {
    backgroundColor: "#F8BEBE",
  },
  addressText: {
    color: "#fff",
    fontSize: 16,
  },
  totalText: { fontSize: 18, color: "#000" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minWidth: 150,
    backgroundColor: "#F24B4B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  checkoutText: { color: "#fff", fontSize: 15 },
  checkoutIcon: { width: 18, height: 18, tintColor: "#fff", resizeMode: "contain" },
});


