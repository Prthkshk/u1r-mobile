import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";
import { useCart } from "../../../context/CartContext";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import { useUser } from "../../../context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const placeholder = require("../../../assets/images/placeholder.png");

const getImageUri = (item) => {
  if (!item) return null;
  const candidates = [];
  if (typeof item.image === "string") candidates.push(item.image);
  if (typeof item.image?.url === "string") candidates.push(item.image.url);
  if (typeof item.image?.secure_url === "string") candidates.push(item.image.secure_url);
  if (typeof item.imageUrl === "string") candidates.push(item.imageUrl);
  if (typeof item.thumbnail === "string") candidates.push(item.thumbnail);
  if (typeof item.thumbnail?.url === "string") candidates.push(item.thumbnail.url);
  if (typeof item.thumbnail?.secure_url === "string") candidates.push(item.thumbnail.secure_url);
  if (Array.isArray(item.images)) {
    item.images.forEach((img) => {
      if (typeof img === "string") candidates.push(img);
      else if (typeof img?.url === "string") candidates.push(img.url);
      else if (typeof img?.secure_url === "string") candidates.push(img.secure_url);
    });
  }
  if (Array.isArray(item.thumbnails)) {
    item.thumbnails.forEach((img) => {
      if (typeof img === "string") candidates.push(img);
      else if (typeof img?.url === "string") candidates.push(img.url);
      else if (typeof img?.secure_url === "string") candidates.push(img.secure_url);
    });
  }
  const isUsable = (v) => {
    if (typeof v !== "string") return false;
    const trimmed = v.trim();
    if (!trimmed) return false;
    if (trimmed.toLowerCase().includes("placeholder")) return false;
    return true;
  };
  return candidates.find(isUsable) || null;
};

const getImageSource = (item) => {
  const uri = getImageUri(item);
  return uri ? { uri: withBaseUrl(uri) } : placeholder;
};

/* ───────────── HEADER ───────────── */
const Header = React.memo(({ navigation, title, mode }) => {
  return (
    <LinearGradient
      colors={["#FFCACA", "#FFFFFF"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.iconBtn}
      >
        <Image
          source={require("../../../assets/icons/arrow-left.png")}
          style={styles.icon}
        />
      </TouchableOpacity>

      <Text style={[Fonts.heading, styles.title]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Search")}
          style={styles.iconBtn}
        >
          <SearchIcon width={26} height={26} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
});

/* ───────────── PRODUCT CARD (DESIGN UNCHANGED) ───────────── */
const ProductCard = React.memo(
  ({ item, cartEntry, addToCart, incrementItem, decrementItem, onPress }) => {
    const priceValue =
      item.discountPrice ?? item.price ?? item.moqPrice ?? 0;

    const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
    const outOfStock =
      item?.stock !== undefined &&
      item?.stock !== null &&
      item?.stock !== "" &&
      Number(item.stock) <= 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={{ flex: 1 }}>
          <Text style={[Fonts.bodyBold, styles.productName]}>
            {item.name}
          </Text>

          <Text style={[Fonts.body, styles.weight]}>
            {item.weight || "1 Kg"}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[Fonts.bodyExtraBold, styles.price]}>
              {"\u20B9"}{Number(priceValue).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <Image
            source={getImageSource(item)}
            style={styles.productImg}
          />

          {outOfStock ? (
            <View style={styles.outOfStockWrap}>
              <Text style={[Fonts.bodyBold, styles.outOfStockText]}>Out of Stock</Text>
            </View>
          ) : cartEntry ? (
            <View style={styles.counter}>
              <TouchableOpacity
                onPress={() => decrementItem(cartEntry.id)}
                disabled={!canDecrement}
                style={[
                  styles.counterBtn,
                  !canDecrement && styles.counterBtnDisabled,
                ]}
              >
                <Text style={[Fonts.bodyBold, styles.counterBtnText]}>-</Text>
              </TouchableOpacity>

              <Text style={[Fonts.bodyBold, styles.counterValue]}>
                {cartEntry.qty}
              </Text>

              <TouchableOpacity
                onPress={() => incrementItem(cartEntry.id)}
                style={styles.counterBtn}
              >
                <Text style={[Fonts.bodyBold, styles.counterBtnText]}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}   // 🔒 SAME BUTTON
              delayPressIn={0}
              onPress={() =>
                addToCart({
                  ...item,
                  price: priceValue,
                  qty: Math.max(Number(item?.moq) || 0, 1),
                })
              }
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
      </TouchableOpacity>
    );
  }
);

/* ───────────── MAIN SCREEN ───────────── */
export default function ProductListScreen({ navigation, route }) {
  const { mode: userMode } = useUser();
  const {
    categoryId,
    categoryName,
    subcategoryId,
    mode: incomingMode,
  } = route.params || {};
  const mode = incomingMode || userMode || "wholesale";

  const [products, setProducts] = useState([]);
  const requestIdRef = useRef(0);

  const { cartItems, addToCart, incrementItem, decrementItem } = useCart();
  const totalItems = cartItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );
  const cartLabel = totalItems === 1 ? "item" : "items";
  const showCartBar = totalItems > 0;

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

  /* 🚀 O(1) cart lookup */
  const cartMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [cartItems]);

  const fetchProducts = async (cacheKey, requestId) => {
    try {
      const url = subcategoryId
        ? mode === "retail"
          ? `${API_BASE_URL}/api/retail/products/subcategory/${subcategoryId}`
          : `${API_BASE_URL}/api/public/products/subcategory/${subcategoryId}`
        : mode === "retail"
        ? `${API_BASE_URL}/api/retail/products/category/${categoryId}`
        : `${API_BASE_URL}/api/public/products/category/${categoryId}`;

      const res = await axios.get(url, { params: { mode } });
      if (requestIdRef.current !== requestId) return;
      const incoming = res.data?.data || res.data || [];
      const visible = incoming;
      // Ensure UI respects admin-defined positions even if backend order shifts
      const sorted = Array.isArray(visible)
        ? [...visible].sort((a, b) => {
            const pa = Number(a?.position);
            const pb = Number(b?.position);
            const aOk = Number.isFinite(pa);
            const bOk = Number.isFinite(pb);
            if (aOk && bOk) return pa - pb;
            if (aOk) return -1;
            if (bOk) return 1;
            return 0;
          })
        : visible;
      setProducts(sorted);
      AsyncStorage.setItem(cacheKey, JSON.stringify(sorted)).catch(() => {});
    } catch (err) {
      console.log("PRODUCT LIST ERROR:", err);
    }
  };

  useEffect(() => {
    const cacheKey = `wholesale_products_${mode}_${subcategoryId || categoryId}`;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let isActive = true;
    AsyncStorage.getItem(cacheKey)
      .then((data) => {
        if (!isActive || !data) return;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      })
      .catch(() => {});

    fetchProducts(cacheKey, requestId);
    return () => {
      isActive = false;
    };
  }, [categoryId, subcategoryId, mode]);

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        item={item}
        cartEntry={cartMap[item._id]}
        addToCart={addToCart}
        incrementItem={incrementItem}
        decrementItem={decrementItem}
        onPress={() =>
          navigation.navigate("ProductDetail", {
            product: item,
            productId: item._id,
            mode,
          })
        }
      />
    ),
    [addToCart, cartMap, decrementItem, incrementItem, navigation, mode]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F5F5" }}
      edges={["bottom"]}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={
          <Header navigation={navigation} title={categoryName} mode={mode} />
        }
        stickyHeaderIndices={[0]}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: showCartBar ? 120 : 24 }}
      />
      {showCartBar && (
        <SafeAreaView style={styles.cartBarSafe} edges={["bottom"]}>
          <TouchableOpacity
            style={styles.cartBar}
            onPress={() =>
              navigation.navigate("HomeTabs", {
                screen: "Cart",
                params: { mode },
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
    </SafeAreaView>
  );
}

/* ───────────── STYLES (UNCHANGED) ───────────── */
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

  iconBtn: { padding: 4 },
  icon: {
    width: 26,
    height: 26,
    tintColor: "#000",
    resizeMode: "contain",
  },

  title: {
    fontSize: 20,
    color: "#000",
    maxWidth: 220,
  },

  headerRight: {
    flexDirection: "row",
    gap: 10,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "stretch",
  },

  productImg: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },

  productName: {
    fontSize: 17,
    color: "#000",
  },

  weight: {
    color: "#B0B0B0",
    marginTop: 6,
    fontSize: 13,
    marginBottom: 20,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  price: {
    fontSize: 20,
    color: "#000",
  },

  rightCol: {
    width: 125,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  addBtn: {
    borderWidth: 1.5,
    borderColor: "#FF2E2E",
    backgroundColor: "#fff",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  addBtnText: {
    color: "#FF2E2E",
    fontSize: 15,
  },
  outOfStockWrap: {
    borderWidth: 1.5,
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  outOfStockText: {
    color: "#757575",
    fontSize: 13,
  },

  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FF2E2E",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: "flex-start",
    minWidth: 110,
    height: 36,
  },

  counterBtn: {
    width: 24,
    alignItems: "center",
  },

  counterBtnDisabled: {
    opacity: 0.4,
  },

  counterBtnText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
  },

  counterValue: {
    color: "#fff",
    fontSize: 15,
    minWidth: 26,
    textAlign: "center",
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



