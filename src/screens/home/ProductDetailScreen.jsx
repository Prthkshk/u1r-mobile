import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
  Animated,
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

const { width } = Dimensions.get("window");
const placeholder = require("../../assets/images/placeholder.png");

export default function ProductDetailScreen({ navigation, route }) {
  const { product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct || null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [loading, setLoading] = useState(!initialProduct);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [qtyInput, setQtyInput] = useState(() => String(Math.max(Number(initialProduct?.moq) || 0, 1)));
  const minQty = useMemo(
    () => Math.max(Number(product?.moq) || 0, 1),
    [product]
  );

  const { cartItems, addToCart, incrementItem, decrementItem, setItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const productId = product?._id || product?.id;
  const cartEntry = useMemo(
    () => cartItems.find((c) => c.id === productId),
    [cartItems, productId]
  );
  const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
  const isWishlisted = isInWishlist(productId);
  const pinchScale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(new Animated.Value(1)).current;
  const scale = useMemo(
    () => Animated.multiply(baseScale, pinchScale),
    [baseScale, pinchScale]
  );
  const lastScale = useRef(1);

  const handlePinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const handlePinchStateChange = (event) => {
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      lastScale.current *= event.nativeEvent.scale;
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  };

  const images = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image) list.push(product.image);
    if (product.images && product.images.length) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [product]);

  const normalizeImage = (uri) => (uri ? withBaseUrl(uri) : null);

  const fetchData = async () => {
    try {
      if (!initialProduct?._id) return;
      const [detailRes, similarRes, recommendedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/public/products/${initialProduct._id}`),
        axios.get(`${API_BASE_URL}/api/public/products/similar/${initialProduct._id}`),
        axios.get(`${API_BASE_URL}/api/public/products/recommended/${initialProduct._id}`),
      ]);
      setProduct(detailRes.data);
      setSimilarProducts(similarRes.data || []);
      setRecommended(recommendedRes.data || []);
    } catch (err) {
      console.log("PRODUCT DETAIL ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialProduct?._id) return;
    fetchData();
  }, []);

  const handleOpenQtyModal = () => {
    setQtyInput(String(cartEntry?.qty || minQty));
    setQtyModalVisible(true);
  };

  const handleAddToCart = () => {
    const qty = Math.max(minQty, parseInt(qtyInput || "0", 10) || minQty);
    if (cartEntry) {
      setItemQuantity(cartEntry.id, qty);
    } else {
      addToCart({ ...product, moq: minQty, qty });
    }
    setQtyModalVisible(false);
  };

  const handleToggleWishlist = () => {
    if (!productId) return;
    const firstImage = product?.image || images[0];
    toggleWishlist({ ...product, id: productId, image: firstImage });
  };

  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);

  const handleAddFromList = (item) => {
    addToCart({
      ...item,
      id: item._id || item.id,
      moq: getMinQty(item),
      qty: getMinQty(item),
    });
  };

  useEffect(() => {
    if (!zoomImage) {
      lastScale.current = 1;
      baseScale.setValue(1);
      pinchScale.setValue(1);
    }
  }, [zoomImage, baseScale, pinchScale]);

  if (!product || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF2E2E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Image
              source={require("../../assets/icons/arrow-left.png")}
              style={styles.icon}
            />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Search")}
            >
              <Image
                source={require("../../assets/icons/search.png")}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={handleToggleWishlist}
            >
              <Image
                source={require("../../assets/icons/heart.png")}
                style={[
                  styles.icon,
                  styles.iconHeart,
                  { tintColor: isWishlisted ? "#FF2E2E" : "#000" },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* IMAGE SLIDER */}
        <View style={styles.imageWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setActiveImage(idx);
            }}
            scrollEventThrottle={16}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => setZoomImage(normalizeImage(img))}
              >
                <Image
                  source={
                    normalizeImage(img)
                      ? { uri: normalizeImage(img) }
                      : placeholder
                  }
                  style={[styles.productImg, { width }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === activeImage && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* PRODUCT CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[Fonts.bodyBold, styles.productName]}>
              {product.name}
            </Text>
            <Image
              source={require("../../assets/images/veg.png")}
              style={styles.veg}
            />
          </View>

          <Text style={[Fonts.body, styles.weight]}>
            {product.weight || "1 Kg"}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[Fonts.bodyBold, styles.price]}>
              {formatPrice(product.price)}
            </Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={[styles.section, styles.sectionBorder]}>
          <Text style={[Fonts.heading, styles.sectionTitle]}>
            Product Details
          </Text>
          <Text style={[Fonts.body, styles.detailText]}>
            {product.description ||
              "Our premium nuts are fresh, crunchy, and naturally sweet. Rich in healthy fats, antioxidants, and vitamins, they make a perfect snack and can be added to desserts, smoothies, salads, and baking recipes. Enjoy wholesome goodness in every bite."}
          </Text>
        </View>

        {/* SIMILAR PRODUCTS */}
        {similarProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={[Fonts.heading, styles.sectionTitle]}>
              Similar Products
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {similarProducts.map((item) => (
                <TouchableOpacity
                  key={item._id || item.id}
                  style={styles.listCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.push("ProductDetail", {
                      product: item,
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[Fonts.bodyBold, styles.listName]}>
                      {item.name}
                    </Text>
                    <Text style={[Fonts.body, styles.listWeight]}>
                      {item.weight || "1 Kg"}
                    </Text>
                    <View style={styles.listPriceRow}>
                      <Text style={[Fonts.bodyBold, styles.listPrice]}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listAside}>
                    <Image
                      source={
                        normalizeImage(item.image)
                          ? { uri: normalizeImage(item.image) }
                          : placeholder
                      }
                      style={styles.listImg}
                    />

                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleAddFromList(item);
                      }}
                    >
                      <Text style={[Fonts.bodyBold, styles.addBtnText]}>
                        Add to Cart
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* MORE LIKE THIS */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            <Text style={[Fonts.heading, styles.sectionTitle]}>
              More Like this
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recommended.map((item) => (
                <TouchableOpacity
                  key={item._id || item.id}
                  style={styles.listCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.push("ProductDetail", {
                      product: item,
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[Fonts.bodyBold, styles.listName]}>
                      {item.name}
                    </Text>
                    <Text style={[Fonts.body, styles.listWeight]}>
                      {item.weight || "1 Kg"}
                    </Text>
                    <View style={styles.listPriceRow}>
                      <Text style={[Fonts.bodyBold, styles.listPrice]}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listAside}>
                    <Image
                      source={
                        normalizeImage(item.image)
                          ? { uri: normalizeImage(item.image) }
                          : placeholder
                      }
                      style={styles.listImg}
                    />

                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleAddFromList(item);
                      }}
                    >
                      <Text style={[Fonts.bodyBold, styles.addBtnText]}>
                        Add to Cart
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.viewCartBtn}
          onPress={() => navigation.navigate("HomeTabs", { screen: "Cart" })}
        >
          <Image
            source={require("../../assets/icons/cart2.png")}
            style={styles.bottomIcon}
          />
          <Text style={[Fonts.bodyBold, styles.viewCartText]}>View Cart</Text>
        </TouchableOpacity>

        {cartEntry ? (
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

            <TouchableOpacity onPress={handleOpenQtyModal}>
              <Text style={[Fonts.bodyBold, styles.counterValue]}>
                {cartEntry.qty}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => incrementItem(cartEntry.id)}
              style={styles.counterBtn}
            >
              <Text style={[Fonts.bodyBold, styles.counterBtnText]}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.ctaBtn} onPress={handleOpenQtyModal}>
            <Text style={[Fonts.bodyBold, styles.ctaText]}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* QTY MODAL */}
      <Modal
        visible={qtyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQtyModalVisible(false)}
      >
        <View style={styles.qtyBackdrop}>
          <View style={styles.qtyCard}>
            <Text style={[Fonts.heading, styles.qtyTitle]}>Update Quantity</Text>
            <Text style={[Fonts.body, styles.qtySubtitle]}>
              Minimum Quantity : {minQty}
            </Text>

            <TextInput
              value={qtyInput}
              onChangeText={setQtyInput}
              keyboardType="numeric"
              placeholder="Enter Quantity"
              placeholderTextColor="#B3B3B3"
              style={[Fonts.bodyBold, styles.qtyInput]}
            />

            <View style={styles.qtyActions}>
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnOutline]}
                onPress={() => setQtyModalVisible(false)}
              >
                <Text style={[Fonts.bodyBold, styles.qtyBtnOutlineText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnSolid]}
                onPress={handleAddToCart}
              >
                <Text style={[Fonts.bodyBold, styles.qtyBtnSolidText]}>
                  Add to Cart
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ZOOM MODAL */}
      <Modal
        visible={!!zoomImage}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            onPress={() => setZoomImage(null)}
            style={styles.modalClose}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCloseText}>X</Text>
          </TouchableOpacity>

          <PinchGestureHandler
            onGestureEvent={handlePinchEvent}
            onHandlerStateChange={handlePinchStateChange}
          >
            <Animated.View
              style={[styles.modalContent, { transform: [{ scale }] }]}
            >
              <Image
                source={{ uri: zoomImage }}
                style={styles.zoomImg}
                resizeMode="contain"
              />
            </Animated.View>
          </PinchGestureHandler>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRight: { flexDirection: "row", gap: 14 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  icon: { width: 20, height: 20, tintColor: "#000", resizeMode: "contain" },
  iconHeart: { width: 18, height: 18 },
  imageWrap: { alignItems: "center", backgroundColor: "#fff" },
  productImg: { height: 260 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d9d9d9",
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: "#999" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DCDCDC",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  veg: { width: 22, height: 22, resizeMode: "contain" },
  productName: { fontSize: 18, color: "#000" },
  weight: { color: "#666", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  price: { fontSize: 18, color: "#000", marginRight: 8 },
  section: { marginHorizontal: 0, marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, color: "#000", marginBottom: 10 },
  detailText: { color: "#444", lineHeight: 20 },
  sectionBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#DCDCDC",
    paddingVertical: 16,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    width: width - 24,
    minHeight: 150,
  },
  listAside: {
    alignItems: "center",
    justifyContent: "space-between",
    width: 128,
    marginLeft: 16,
  },
  listImg: { width: 92, height: 92, borderRadius: 12 },
  horizontalList: { paddingRight: 14 },
  listName: { fontSize: 16, color: "#000" },
  listWeight: { color: "#999", marginTop: 6 },
  listPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  listPrice: { fontSize: 18, color: "#000", marginRight: 8 },
  addBtn: {
    borderWidth: 1.5,
    borderColor: "#FF2E2E",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  addBtnText: { color: "#FF2E2E", fontSize: 13 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  viewCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#FF2E2E",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 4,
    marginLeft: 0,
    justifyContent: "center",
    gap: 8,
  },
  ctaBtn: {
    backgroundColor: "#FF2E2E",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: "center",
    marginLeft: 4,
    marginRight: 0,
  },
  bottomIcon: { width: 18, height: 18, tintColor: "#FF2E2E" },
  viewCartText: { color: "#FF2E2E", fontSize: 14 },
  ctaText: { color: "#fff", fontSize: 14 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2E2E",
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
    justifyContent: "center",
    marginLeft: 4,
    marginRight: 0,
  },
  counterBtn: { paddingHorizontal: 10 },
  counterBtnDisabled: { opacity: 0.5 },
  counterBtnText: { color: "#fff", fontSize: 18 },
  counterValue: { color: "#fff", fontSize: 15, marginHorizontal: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  qtyCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  qtyTitle: { fontSize: 20, color: "#000", textAlign: "center" },
  qtySubtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    textAlign: "center",
    marginTop: 6,
  },
  qtyInput: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#000",
    fontSize: 16,
  },
  qtyActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
  },
  qtyBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  qtyBtnOutline: {
    borderWidth: 1.4,
    borderColor: "#FF2E2E",
    backgroundColor: "#fff",
  },
  qtyBtnOutlineText: { color: "#FF2E2E", fontSize: 15 },
  qtyBtnSolid: { backgroundColor: "#FF2E2E" },
  qtyBtnSolidText: { color: "#fff", fontSize: 15 },
  modalContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modalClose: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalCloseText: { fontSize: 20, color: "#000" },
  zoomImg: { width: width, height: width * 1.2 },
});
