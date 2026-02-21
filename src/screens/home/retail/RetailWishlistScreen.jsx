import React, { useMemo } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Fonts } from "../../styles/typography";
import { useWishlist } from "../../../context/WishlistContext";
import { useCart } from "../../../context/CartContext";
import { withBaseUrl } from "../../../config/api";

const placeholder = require("../../../assets/images/placeholder.png");
const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

export default function RetailWishlistScreen({ navigation }) {
  const { items, toggleWishlist } = useWishlist();
  const { cartItems, addToCart, incrementItem, decrementItem } = useCart();

  const normalizeImage = (uri) => (uri ? withBaseUrl(uri) : null);

  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);
  const cartMap = useMemo(() => {
    const next = {};
    cartItems.forEach((item) => {
      const key = normalizeId(item?.id || item?._id);
      if (!key) return;
      next[key] = item;
    });
    return next;
  }, [cartItems]);
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cartItems]
  );
  const cartLabel = totalItems === 1 ? "item" : "items";
  const cartPreview = useMemo(
    () => cartItems.filter((item) => item?.image).slice(0, 3),
    [cartItems]
  );
  const getCartImage = (item) => {
    if (!item) return placeholder;
    if (typeof item.image === "string") {
      const trimmed = item.image.trim();
      if (trimmed && !trimmed.toLowerCase().includes("placeholder")) {
        return { uri: withBaseUrl(trimmed) };
      }
    }
    return item.image || placeholder;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <LinearGradient
        colors={["#FFD3D3", "#FFFFFF"]}
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

        <Text style={[Fonts.heading, styles.headerTitle]}>Wishlist</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate("Search")}
          >
            <SearchIcon width={22} height={22} style={styles.headerIcon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.contentWrap,
          totalItems > 0 && styles.contentWrapWithCartBar,
        ]}
      >
        {items.length === 0 ? (
          <Text style={[Fonts.bodyBold, styles.emptyText]}>No items in wishlist</Text>
        ) : (
          items.map((item) => {
            const productId = normalizeId(item.id || item._id);
            const cartEntry = cartMap[productId];
            return (
              <TouchableOpacity
                key={productId}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("RetailProductDetail", {
                    product: item,
                    productId,
                    mode: "retail",
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={[Fonts.bodyBold, styles.name]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[Fonts.body, styles.weight]}>
                    {item.weight || item.unit || ""}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[Fonts.heading, styles.price]}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>

                  {cartEntry ? (
                    <View style={styles.counterWrap}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          decrementItem(cartEntry.id);
                        }}
                        style={styles.counterBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.counterBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{cartEntry.qty}</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          incrementItem(cartEntry.id);
                        }}
                        style={styles.counterBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.counterBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        const minQty = getMinQty(item);
                        addToCart({
                          ...item,
                          id: productId,
                          moq: minQty,
                          qty: minQty,
                          mode: "retail",
                        });
                      }}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[Fonts.bodyBold, styles.addBtnText]}
                        numberOfLines={1}
                        allowFontScaling={false}
                      >
                        Add to Cart
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Image
                  source={
                    normalizeImage(item.image)
                      ? { uri: normalizeImage(item.image) }
                      : placeholder
                  }
                  style={styles.image}
                  resizeMode="contain"
                />

                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    toggleWishlist(item);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="favorite" size={18} color="#F24B4B" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {totalItems > 0 && (
        <SafeAreaView style={styles.cartBarSafe} edges={["bottom"]}>
          <TouchableOpacity
            style={styles.cartBar}
            onPress={() =>
              navigation.navigate("HomeTabs", {
                screen: "Cart",
              })
            }
          >
            <View style={styles.cartThumbs}>
              {cartPreview.map((item, index) => (
                <View key={item.id || item._id || index} style={styles.thumbWrap}>
                  <Image source={getCartImage(item)} style={styles.thumbImg} />
                </View>
              ))}
            </View>
            <View style={styles.cartInfo}>
              <Text style={[Fonts.bodyBold, styles.cartTitle]}>View cart</Text>
              <Text style={[Fonts.body, styles.cartSubtitle]}>
                {totalItems} {cartLabel}
              </Text>
            </View>
            <Image
              source={require("../../../assets/icons/arrow-right.png")}
              style={styles.cartArrow}
            />
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  contentWrap: { padding: 14, paddingBottom: 30 },
  contentWrapWithCartBar: { paddingBottom: 120 },
  emptyText: { textAlign: "center", marginTop: 30, color: "#8A8A8A" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    position: "relative",
    marginBottom: 12,
  },
  name: { fontSize: 14, color: "#000" },
  weight: { fontSize: 12, color: "#999", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  price: { color: "#000", fontSize: 18 },
  addBtn: {
    borderWidth: 1.2,
    borderColor: "#F24B4B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 110,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  addBtnText: { color: "#F24B4B", fontSize: 12 },
  counterWrap: {
    marginTop: 10,
    minWidth: 110,
    minHeight: 34,
    alignSelf: "flex-start",
    backgroundColor: "#FF2E2E",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 14,
  },
  counterBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  counterBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
  },
  counterValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 14,
    textAlign: "center",
  },
  image: { width: 82, height: 82, borderRadius: 10 },
  heartBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    padding: 6,
  },
  cartBarSafe: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    paddingBottom: 16,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FF2E2E",
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cartThumbs: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  thumbWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
    borderWidth: 2,
    borderColor: "#FF2E2E",
  },
  thumbImg: { width: 28, height: 28, borderRadius: 14, resizeMode: "contain" },
  cartInfo: { flex: 1 },
  cartTitle: { color: "#fff", fontSize: 15 },
  cartSubtitle: { color: "#E7F5E8", fontSize: 12, marginTop: 2 },
  cartArrow: { width: 18, height: 18, tintColor: "#fff", resizeMode: "contain" },
});



