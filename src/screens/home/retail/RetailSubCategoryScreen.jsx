import React, { useCallback, useEffect, useMemo, useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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

export default function RetailSubCategoryScreen({ navigation, route }) {
  const { categoryId, categoryName } = route.params || {};
  const [subcats, setSubcats] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasSubcats, setHasSubcats] = useState(true);
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();
  const CHUNK_SIZE = 20;
  const CHUNK_DELAY = 50;

  const cartMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [cartItems]);

  const fetchSubcats = async () => {
    try {
      let res;
      try {
        res = await axios.get(
          `${API_BASE_URL}/api/retail/categories/${categoryId}/subcategories`,
          { params: { mode: "retail" } }
        );
      } catch (err) {
        if (err?.response?.status === 404) {
          res = await axios.get(
            `${API_BASE_URL}/api/public/subcategories/${categoryId}`,
            { params: { mode: "retail" } }
          );
        } else {
          throw err;
        }
      }
      const incoming = res.data?.data || res.data || [];
      const nextSubcats = Array.isArray(incoming) ? incoming : [];
      setSubcats(nextSubcats);
      setHasSubcats(nextSubcats.length > 0);
      if (nextSubcats.length > 0) {
        setSelectedId((prev) => prev || nextSubcats[0]._id);
      } else {
        setSelectedId(null);
        fetchProductsByCategory();
      }
    } catch (err) {
      console.log("RETAIL SUBCATEGORY ERROR:", err?.response?.data || err?.message);
    }
  };

  const fetchProducts = async (subcategoryId) => {
    if (!subcategoryId) return;
    try {
      let res;
      try {
        res = await axios.get(
          `${API_BASE_URL}/api/retail/products/subcategory/${subcategoryId}`,
          { params: { mode: "retail" } }
        );
      } catch (err) {
        if (err?.response?.status === 404) {
          res = await axios.get(
            `${API_BASE_URL}/api/public/products/subcategory/${subcategoryId}`,
            { params: { mode: "retail" } }
          );
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
      const filtered = Array.isArray(incoming) ? incoming.filter(isActive) : [];
      setProducts(filtered);
    } catch (err) {
      console.log("RETAIL SUBCATEGORY PRODUCTS ERROR:", err?.response?.data || err?.message);
    }
  };

  const fetchProductsByCategory = async () => {
    if (!categoryId) return;
    try {
      let res;
      try {
        res = await axios.get(
          `${API_BASE_URL}/api/retail/products/category/${categoryId}`,
          { params: { mode: "retail" } }
        );
      } catch (err) {
        if (err?.response?.status === 404) {
          res = await axios.get(
            `${API_BASE_URL}/api/public/products/category/${categoryId}`,
            { params: { mode: "retail" } }
          );
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
      const filtered = Array.isArray(incoming) ? incoming.filter(isActive) : [];
      setProducts(filtered);
    } catch (err) {
      console.log("RETAIL CATEGORY PRODUCTS ERROR:", err?.response?.data || err?.message);
    }
  };

  useEffect(() => {
    setSubcats([]);
    setProducts([]);
    setSelectedId(null);
    setHasSubcats(true);
    fetchSubcats();
  }, [categoryId]);

  useEffect(() => {
    if (selectedId) {
      fetchProducts(selectedId);
    }
  }, [selectedId]);

  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

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


  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);

  const renderProduct = useCallback(({ item }) => {
    const pid = item._id || item.id;
    const cartEntry = cartMap[pid];
    const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
    const outOfStock = !isInStock(item);
    const imageUri = getImageUri(item, "product image");
    const { sale, mrp } = getPrices(item);
    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("RetailProductDetail", {
            product: item,
            productId: pid,
            mode: "retail",
          })
        }
      >
        <View style={styles.productInfo}>
          <Text style={[Fonts.bodyBold, styles.productName]}>
            {getProductName(item)}
          </Text>
          <Text style={[Fonts.body, styles.productWeight]}>
            {item.weight || "1 Kg"}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[Fonts.bodyExtraBold, styles.productPrice]}>
              {formatPrice(sale)}
            </Text>
            {mrp && <Text style={styles.productMrp}>{formatPrice(mrp)}</Text>}
          </View>
        </View>
        <View style={styles.productRight}>
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
                onPress={() => decrementItem(pid)}
                disabled={!canDecrement}
                style={[styles.counterBtn, !canDecrement && styles.counterBtnDisabled]}
              >
                <Text style={[Fonts.bodyBold, styles.counterBtnText]}>-</Text>
              </TouchableOpacity>
              <Text style={[Fonts.bodyBold, styles.counterValue]}>{cartEntry.qty}</Text>
              <TouchableOpacity
                onPress={() => incrementItem(pid)}
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
                  id: pid,
                  moq: getMinQty(item),
                  qty: getMinQty(item),
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
  }, [addToCart, cartMap, decrementItem, incrementItem, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <LinearGradient
        colors={["#FFCACA", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.icon}
          />
        </TouchableOpacity>

        <Text style={[Fonts.heading, styles.title]} numberOfLines={1}>
          {categoryName}
        </Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate("Search")}>
            <SearchIcon width={26} height={26} style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {hasSubcats && (
          <View style={styles.leftPane}>
            <FlatList
              data={subcats}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = item._id === selectedId;
                const imageUri = getImageUri(item, "subcategory image");
                return (
                  <TouchableOpacity
                    style={[styles.subcatItem, active && styles.subcatItemActive]}
                    onPress={() => setSelectedId(item._id)}
                  >
                    <Image
                      source={
                        imageUri ? { uri: withBaseUrl(imageUri) } : placeholder
                      }
                      style={[styles.subcatImg, active && styles.subcatImgActive]}
                    />
                    <Text
                      style={[Fonts.body, styles.subcatLabel, active && styles.subcatLabelActive]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        <View style={[styles.rightPane, !hasSubcats && styles.rightPaneFull]}>
          <FlatList
            data={visibleProducts}
            keyExtractor={(item) => item._id || item.id}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  icon: { width: 24, height: 24, tintColor: "#000", resizeMode: "contain" },
  searchIcon: { width: 26, height: 26, tintColor: "#000", resizeMode: "contain" },
  title: { fontSize: 18, color: "#000", maxWidth: "60%" },
  headerIcons: { flexDirection: "row", gap: 10 },
  body: { flex: 1, flexDirection: "row", backgroundColor: "#f7f7f7" },
  leftPane: {
    width: 90,
    borderRightWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#fff",
    paddingVertical: 10,
  },
  rightPane: { flex: 1, padding: 12 },
  rightPaneFull: { paddingLeft: 16, paddingRight: 16 },
  subcatItem: {
    alignItems: "center",
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  subcatItemActive: {
    borderLeftColor: "#FF2E2E",
    backgroundColor: "#FFF4F4",
  },
  subcatImg: { width: 42, height: 42, borderRadius: 21, marginBottom: 6 },
  subcatImgActive: { borderWidth: 1.5, borderColor: "#FF2E2E" },
  subcatLabel: { fontSize: 11, color: "#444" },
  subcatLabelActive: { color: "#FF2E2E", fontWeight: "700" },
  productCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: "#E6E6E6",
    gap: 12,
  },
  productInfo: { flex: 1, justifyContent: "space-between", paddingRight: 4 },
  productRight: { alignItems: "flex-end", justifyContent: "space-between" },
  productImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#F0F0F0" },
  productName: { fontSize: 16, color: "#111" },
  productWeight: { fontSize: 12, color: "#9A9A9A", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  productPrice: { fontSize: 18, color: "#111" },
  productMrp: { fontSize: 16, color: "#B0B0B0", marginLeft: 8, textDecorationLine: "line-through" },
  addBtn: {
    borderWidth: 1.4,
    borderColor: "#FF2E2E",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    height: 34,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  addBtnText: { fontSize: 13, color: "#FF2E2E" },
  outOfStockWrap: {
    borderWidth: 1.4,
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    height: 34,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  outOfStockText: { fontSize: 12, color: "#757575" },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FF2E2E",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 34,
    minWidth: 110,
    alignSelf: "center",
  },
  counterBtn: { width: 22, alignItems: "center" },
  counterBtnDisabled: { opacity: 0.5 },
  counterBtnText: { color: "#fff", fontSize: 14, lineHeight: 16 },
  counterValue: { color: "#fff", fontSize: 12, minWidth: 20, textAlign: "center" },
});



