import React, { useEffect, useMemo, useState, useCallback } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { Fonts } from "../../styles/typography";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import { useCart } from "../../../context/CartContext";

const placeholder = require("../../../assets/images/placeholder.png");

const isActive = (item) =>
  item?.status === true ||
  item?.status === "true" ||
  item?.status === 1 ||
  item?.status === "1" ||
  item?.status === undefined ||
  item?.status === null;

const isInStock = (item) => {
  if (item?.stock === undefined || item?.stock === null || item?.stock === "") return true;
  return Number(item.stock) > 0;
};

const getImageUri = (item) => {
  if (!item) return "";
  const candidates = [];
  if (typeof item.image === "string") candidates.push(item.image);
  if (typeof item.imageUrl === "string") candidates.push(item.imageUrl);
  if (typeof item.image?.url === "string") candidates.push(item.image.url);
  if (typeof item.image?.secure_url === "string") candidates.push(item.image.secure_url);
  if (typeof item.thumbnail === "string") candidates.push(item.thumbnail);
  if (typeof item.thumbnail?.url === "string") candidates.push(item.thumbnail.url);
  if (Array.isArray(item.images) && item.images.length) {
    item.images.forEach((img) => {
      if (typeof img === "string") candidates.push(img);
      else if (typeof img?.url === "string") candidates.push(img.url);
      else if (typeof img?.secure_url === "string") candidates.push(img.secure_url);
    });
  }
  if (Array.isArray(item.thumbnails) && item.thumbnails.length) {
    item.thumbnails.forEach((img) => {
      if (typeof img === "string") candidates.push(img);
      else if (typeof img?.url === "string") candidates.push(img.url);
      else if (typeof img?.secure_url === "string") candidates.push(img.secure_url);
    });
  }
  const uri = candidates.find(Boolean) || "";
  return uri;
};

const getProductName = (item) =>
  item?.name || item?.productName || item?.title || item?.product_title || "";

const pickNumber = (...values) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
};

const formatPrice = (value) =>
  `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

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

const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);

/* HEADER (MATCH WHOLESALE DESIGN) */
const Header = React.memo(({ navigation, title }) => {
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

/* PRODUCT CARD (MATCH WHOLESALE DESIGN) */
const ProductCard = React.memo(
  ({ item, cartEntry, addToCart, incrementItem, decrementItem, onPress }) => {
    const { sale, mrp } = getPrices(item);
    const priceValue = getPrices(item).sale || 0;
    const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
    const imageUri = getImageUri(item, "product image");
    const outOfStock = !isInStock(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={{ flex: 1 }}>
          <Text style={[Fonts.bodyBold, styles.productName]}>
            {getProductName(item)}
          </Text>

          <Text style={[Fonts.body, styles.weight]}>
            {item.weight || "1 Kg"}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[Fonts.bodyExtraBold, styles.price]}>
              {formatPrice(sale)}
            </Text>
            {mrp && (
              <Text style={styles.mrp}>
                {formatPrice(mrp)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightCol}>
          <Image
            source={imageUri ? { uri: withBaseUrl(imageUri) } : placeholder}
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
              style={styles.addBtn}
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

export default function RetailProductListScreen({ navigation, route }) {
  const { categoryId, categoryName, subcategoryId } = route.params || {};
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();
  const CHUNK_SIZE = 20;
  const CHUNK_DELAY = 50;
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

  const cartMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [cartItems]);

  const fetchProducts = async () => {
    try {
      const url = subcategoryId
        ? `${API_BASE_URL}/api/retail/products/subcategory/${subcategoryId}`
        : `${API_BASE_URL}/api/retail/products/category/${categoryId}`;
      let res;
      try {
        res = await axios.get(url, { params: { mode: "retail" } });
      } catch (err) {
        if (err?.response?.status === 404) {
          const fallbackUrl = subcategoryId
            ? `${API_BASE_URL}/api/public/products/subcategory/${subcategoryId}`
            : `${API_BASE_URL}/api/public/products/category/${categoryId}`;
          res = await axios.get(fallbackUrl, { params: { mode: "retail" } });
        } else {
          throw err;
        }
      }
      const raw = res.data?.data ?? res.data ?? [];
      const incoming = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.products)
        ? raw.products
        : Array.isArray(raw?.items)
        ? raw.items
        : [];
      const filtered = Array.isArray(incoming)
        ? incoming.filter((item) => isActive(item))
        : [];
      // Keep admin-defined order stable
      const sorted = [...filtered].sort((a, b) => {
        const pa = Number(a?.position);
        const pb = Number(b?.position);
        const aOk = Number.isFinite(pa);
        const bOk = Number.isFinite(pb);
        if (aOk && bOk) return pa - pb;
        if (aOk) return -1;
        if (bOk) return 1;
        return 0;
      });
      setProducts(sorted);
    } catch (err) {
      console.log("RETAIL PRODUCTS ERROR:", err?.response?.data || err?.message);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId, subcategoryId]);

  useEffect(() => {
    let cancelled = false;
    if (!products.length) {
      setVisibleCount(0);
      return undefined;
    }
    const initial = Math.min(CHUNK_SIZE, products.length);
    setVisibleCount(initial);
    let current = initial;
    let timer;
    const step = () => {
      if (cancelled) return;
      if (current >= products.length) return;
      current = Math.min(current + CHUNK_SIZE, products.length);
      setVisibleCount(current);
      if (current < products.length) {
        timer = setTimeout(step, CHUNK_DELAY);
      }
    };
    timer = setTimeout(step, CHUNK_DELAY);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [products]);

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        item={item}
        cartEntry={cartMap[item._id || item.id]}
        addToCart={addToCart}
        incrementItem={incrementItem}
        decrementItem={decrementItem}
        onPress={() =>
          navigation.navigate("RetailProductDetail", {
            product: item,
            productId: item._id || item.id,
            mode: "retail",
          })
        }
      />
    ),
    [addToCart, cartMap, decrementItem, incrementItem, navigation]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F5" }} edges={["bottom"]}>
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <Header navigation={navigation} title={categoryName || "Products"} />
        }
        stickyHeaderIndices={[0]}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
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
                params: { mode: "retail" },
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

  mrp: {
    fontSize: 14,
    color: "#999",
    marginLeft: 10,
    textDecorationLine: "line-through",
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



