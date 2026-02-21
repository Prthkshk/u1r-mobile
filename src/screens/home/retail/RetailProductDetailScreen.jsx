import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
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
  Animated,
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import VegIcon from "../../../assets/images/veg.svg";
import Cart2Icon from "../../../assets/icons/scart.svg";
import { useUser } from "../../../context/UserContext";

const isActive = (item) =>
  item?.status === true ||
  item?.status === "true" ||
  item?.status === 1 ||
  item?.status === "1";

const isActiveOrUnknown = (item) => {
  if (!item) return false;
  if (item?.status === undefined || item?.status === null) return true;
  return isActive(item);
};
const isInStock = (item) => {
  if (item?.stock === undefined || item?.stock === null || item?.stock === "") return true;
  return Number(item.stock) > 0;
};

const { width } = Dimensions.get("window");
const placeholder = require("../../../assets/images/placeholder.png");

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (cleaned && Number.isFinite(Number(cleaned))) return Number(cleaned);
  }
  return NaN;
};

const pickNumber = (...values) => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

export default function RetailProductDetailScreen({ navigation, route }) {
  const { mode: userMode, userId } = useUser();
  const params = route?.params || {};
  const initialProduct = params.product || null;
  const initialProductId =
    params.productId || initialProduct?._id || initialProduct?.id;
  const mode = params.mode || userMode || "retail";

  const [product, setProduct] = useState(initialProduct || null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [loading, setLoading] = useState(!initialProduct);
  const [notifying, setNotifying] = useState(false);
  const [notifyModal, setNotifyModal] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const minQty = useMemo(
    () => Math.max(Number(product?.moq) || 0, 1),
    [product]
  );

  const { cartItems, cartCount, addToCart, incrementItem, decrementItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const productId = product?._id || product?.id || initialProductId;
  const cartEntry = useMemo(
    () => cartItems.find((c) => c.id === productId),
    [cartItems, productId]
  );
  const cartMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [cartItems]);
  const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
  const outOfStock = !isInStock(product);
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

  const normalizeImage = (uri) => {
    if (!uri) return null;
    return withBaseUrl(uri);
  };

  const getCategoryId = (item) =>
    item?.categoryId?._id ||
    item?.categoryId ||
    item?.category?._id ||
    item?.category ||
    null;

  const fetchData = async () => {
    const idToLoad = initialProductId;
    if (!idToLoad) {
      setLoading(false);
      return;
    }

    try {
      if (!product) {
        setLoading(true);
      }
      const detailUrl =
        mode === "retail"
          ? `${API_BASE_URL}/api/retail/products/${idToLoad}`
          : `${API_BASE_URL}/api/public/products/${idToLoad}`;

      const detailRes = await axios.get(detailUrl, { params: { mode } });
      const detailData = detailRes.data?.data || detailRes.data || detailRes;
      if (isActiveOrUnknown(detailData)) {
        setProduct(detailData);
      } else {
        setProduct(null);
      }

      if (mode === "retail") {
        setRecommended([]);
        const categoryId = getCategoryId(detailData);
        if (categoryId) {
          try {
            let similarRes;
            try {
              similarRes = await axios.get(
                `${API_BASE_URL}/api/retail/products/category/${categoryId}`,
                { params: { mode: "retail" } }
              );
            } catch (err) {
              if (err?.response?.status === 404) {
                similarRes = await axios.get(
                  `${API_BASE_URL}/api/public/products/category/${categoryId}`,
                  { params: { mode: "retail" } }
                );
              } else {
                throw err;
              }
            }
            const list = similarRes.data?.data || similarRes.data || [];
            const currentId = detailData?._id || detailData?.id || idToLoad;
            const filtered = Array.isArray(list)
              ? list.filter(
                  (item) => isActive(item) && (item._id || item.id) !== currentId
                )
              : [];
            setSimilarProducts(filtered);
          } catch (err) {
            console.log("RETAIL SIMILAR PRODUCTS ERROR:", err?.response?.data || err?.message);
            setSimilarProducts([]);
          }
        } else {
          setSimilarProducts([]);
        }
      } else {
        const [similarRes, recommendedRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/public/products/similar/${idToLoad}`, {
            params: { mode: "retail" },
          }),
          axios.get(`${API_BASE_URL}/api/public/products/recommended/${idToLoad}`, {
            params: { mode: "retail" },
          }),
        ]);
        const similar = similarRes.data?.data || similarRes.data || [];
        const recommendedList =
          recommendedRes.data?.data || recommendedRes.data || [];
        setSimilarProducts(similar.filter(isActive));
        setRecommended(recommendedList.filter(isActive));
      }
    } catch (err) {
      console.log("PRODUCT DETAIL ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [initialProductId, mode]);

  const handleAddToCart = () => {
    if (!productId) return;
    if (cartEntry) {
      incrementItem(productId);
    } else {
      addToCart({ ...product, id: productId, moq: minQty, qty: minQty });
    }
  };

  const handleToggleWishlist = () => {
    if (!productId) return;
    const firstImage = product?.image || images[0];
    toggleWishlist({ ...product, id: productId, image: firstImage });
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
    const mrpAlt = pickNumber(item?.actualPrice, item?.maximumRetailPrice, item?.compareAtPrice);
    const finalMrp = mrp > sale ? mrp : mrpAlt > sale ? mrpAlt : null;
    return { sale, mrp: finalMrp };
  };

  const handleNotifyMe = async () => {
    const openNotifyModal = (title, message) =>
      setNotifyModal({ visible: true, title, message });

    if (notifying) return;
    if (!userId) {
      openNotifyModal("Login Required", "Please login to enable stock alerts.");
      return;
    }
    if (!productId) return;

    setNotifying(true);
    openNotifyModal(
      "You're All Set",
      "We will notify you as soon as this product is back in stock."
    );

    try {
      const res = await axios.post(`${API_BASE_URL}/api/stock-alerts/subscribe`, {
        userId,
        productId,
      });
      const alreadyInStock = !!res?.data?.alreadyInStock;
      if (alreadyInStock) {
        openNotifyModal(
          "Now In Stock",
          "This product is available right now. You can add it to cart."
        );
      }
    } catch (err) {
      openNotifyModal(
        "Could Not Set Alert",
        "Please check your internet connection and try again."
      );
    } finally {
      setNotifying(false);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF2E2E" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }} edges={["bottom"]}>
        <Text style={[Fonts.bodyBold, { marginBottom: 12 }]}>
          Product not found.
        </Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.goBack()}>
          <Text style={[Fonts.bodyBold, styles.ctaText]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Image
              source={require("../../../assets/icons/arrow-left.png")}
              style={styles.icon}
            />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Search")}
            >
              <SearchIcon width={20} height={20} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={handleToggleWishlist}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? "#FF2E2E" : "#000"}
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
            {(images.length ? images : [null]).map((img, index) => {
              const normalized = normalizeImage(img, "product image");
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (normalized) setZoomImage(normalized);
                  }}
                >
                  <Image
                    source={normalized ? { uri: normalized } : placeholder}
                    style={[styles.productImg, { width }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
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
            <VegIcon width={22} height={22} />
          </View>

          <Text style={[Fonts.body, styles.weight]}>
            {product.weight || "1 Kg"}
          </Text>

          <View style={styles.priceRow}>
            {(() => {
              const { sale, mrp } = getPrices(product);
              return (
                <>
                  <Text style={[Fonts.bodyBold, styles.price]}>
                    {formatPrice(sale)}
                  </Text>
                  {mrp && (
                    <Text style={[Fonts.body, styles.mrp]}>
                      {formatPrice(mrp)}
                    </Text>
                  )}
                </>
              );
            })()}
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
              {similarProducts.map((item) => {
                const pid = item._id || item.id;
                const entry = cartMap[pid];
                const canDec = (Number(entry?.qty) || 0) > 0;
                return (
                  <TouchableOpacity
                    key={pid}
                  style={styles.listCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.push("RetailProductDetail", {
                      product: item,
                      mode: "retail",
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    {(() => {
                      const { sale, mrp } = getPrices(item);
                      return (
                        <>
                    <Text style={[Fonts.bodyBold, styles.listName]}>
                      {item.name}
                    </Text>
                    <Text style={[Fonts.body, styles.listWeight]}>
                      {item.weight || "1 Kg"}
                    </Text>
                    <View style={styles.listPriceRow}>
                      <Text style={[Fonts.bodyBold, styles.listPrice]}>
                        {formatPrice(sale)}
                      </Text>
                      {!!mrp && (
                        <Text style={styles.listMrp}>
                          {formatPrice(mrp)}
                        </Text>
                      )}
                    </View>
                        </>
                      );
                    })()}
                  </View>

                  <View style={styles.listAside}>
                    {(() => {
                      const normalized = normalizeImage(item.image, "similar product image");
                      return (
                        <Image
                          source={normalized ? { uri: normalized } : placeholder}
                          style={styles.listImg}
                        />
                      );
                    })()}

                    {entry ? (
                      <View style={styles.listCounter}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            decrementItem(pid);
                          }}
                          disabled={!canDec}
                          style={[
                            styles.listCounterBtn,
                            !canDec && styles.listCounterBtnDisabled,
                          ]}
                        >
                          <Text style={[Fonts.bodyBold, styles.listCounterText]}>-</Text>
                        </TouchableOpacity>
                        <Text style={[Fonts.bodyBold, styles.listCounterValue]}>
                          {entry.qty}
                        </Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            incrementItem(pid);
                          }}
                          style={styles.listCounterBtn}
                        >
                          <Text style={[Fonts.bodyBold, styles.listCounterText]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                    <TouchableOpacity
                      style={styles.listAddBtn}
                      delayPressIn={0}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleAddFromList(item);
                        }}
                      >
                        <Text style={[Fonts.bodyBold, styles.addBtnText]}>
                          Add to Cart
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )})}
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
                    navigation.push("RetailProductDetail", {
                      product: item,
                      mode: "retail",
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    {(() => {
                      const { sale, mrp } = getPrices(item);
                      return (
                        <>
                    <Text style={[Fonts.bodyBold, styles.listName]}>
                      {item.name}
                    </Text>
                    <Text style={[Fonts.body, styles.listWeight]}>
                      {item.weight || "1 Kg"}
                    </Text>
                    <View style={styles.listPriceRow}>
                      <Text style={[Fonts.bodyBold, styles.listPrice]}>
                        {formatPrice(sale)}
                      </Text>
                      {!!mrp && (
                        <Text style={styles.listMrp}>
                          {formatPrice(mrp)}
                        </Text>
                      )}
                    </View>
                        </>
                      );
                    })()}
                  </View>

                  <View style={styles.listAside}>
                    {(() => {
                      const normalized = normalizeImage(item.image, "recommended product image");
                      return (
                        <Image
                          source={normalized ? { uri: normalized } : placeholder}
                          style={styles.listImg}
                        />
                      );
                    })()}

                    <TouchableOpacity
                      style={styles.addBtn}
                      delayPressIn={0}
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
        {outOfStock ? (
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={handleNotifyMe}
            disabled={notifying}
          >
            <Ionicons name="notifications-outline" size={18} color="#FF2E2E" />
            <View style={styles.viewCartTextWrap}>
              <Text style={[Fonts.bodyBold, styles.viewCartText]}>
                {notifying ? "Setting..." : "Notify Me"}
              </Text>
              <Text style={[Fonts.body, styles.viewCartSubText]}>
                When available
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() =>
              navigation.navigate("HomeTabs", {
                screen: "Cart",
                params: { mode: "retail" },
              })
            }
          >
            <Cart2Icon width={18} height={18} color="#FF2E2E" />
            <View style={styles.viewCartTextWrap}>
              <Text style={[Fonts.bodyBold, styles.viewCartText]}>View Cart</Text>
              {cartCount > 0 && (
                <Text style={[Fonts.body, styles.viewCartSubText]}>
                  {cartCount} {cartCount === 1 ? "item" : "items"} in cart
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {outOfStock ? (
          <View style={[styles.ctaBtn, styles.outOfStockBtn]}>
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

            <TouchableOpacity>
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
          <TouchableOpacity style={styles.ctaBtn} delayPressIn={0} onPress={handleAddToCart}>
            <Text style={[Fonts.bodyBold, styles.ctaText]}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ZOOM MODAL */}
      <Modal
        visible={notifyModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setNotifyModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <TouchableOpacity
          style={styles.notifyBackdrop}
          activeOpacity={1}
          onPress={() => setNotifyModal((prev) => ({ ...prev, visible: false }))}
        >
          <TouchableOpacity
            style={styles.notifyCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation?.()}
          >
            <Text style={[Fonts.heading, styles.notifyTitle]}>
              {notifyModal.title}
            </Text>
            <Text style={[Fonts.body, styles.notifyMessage]}>
              {notifyModal.message}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
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
  mrp: { fontSize: 14, color: "#999", textDecorationLine: "line-through" },
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
  listMrp: { fontSize: 14, color: "#999", textDecorationLine: "line-through" },
  addBtn: {
    borderWidth: 1.5,
    borderColor: "#FF2E2E",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  listAddBtn: {
    borderWidth: 1.5,
    borderColor: "#FF2E2E",
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-end",
    marginTop: 10,
    height: 32,
    justifyContent: "center",
  },
  addBtnText: { color: "#FF2E2E", fontSize: 13 },
  listCounter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2E2E",
    borderRadius: 10,
    height: 32,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  listCounterBtn: { paddingHorizontal: 8 },
  listCounterBtnDisabled: { opacity: 0.5 },
  listCounterText: { color: "#fff", fontSize: 14 },
  listCounterValue: { color: "#fff", fontSize: 12, marginHorizontal: 8 },
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
    height: 48,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 4,
    marginLeft: 0,
    justifyContent: "center",
    gap: 8,
  },
  viewCartTextWrap: { alignItems: "center", justifyContent: "center" },
  ctaBtn: {
    backgroundColor: "#FF2E2E",
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    marginRight: 0,
  },
  bottomIcon: { width: 18, height: 18, tintColor: "#FF2E2E", resizeMode: "contain" },
  viewCartText: { color: "#FF2E2E", fontSize: 14 },
  viewCartSubText: { color: "#FF2E2E", fontSize: 11, marginTop: 2, lineHeight: 12 },
  ctaText: { color: "#fff", fontSize: 14 },
  outOfStockBtn: {
    backgroundColor: "#E5E5E5",
    borderWidth: 1,
    borderColor: "#CFCFCF",
  },
  outOfStockText: { color: "#757575", fontSize: 14 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2E2E",
    borderRadius: 9,
    height: 48,
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: "center",
    marginLeft: 4,
    marginRight: 0,
  },
  counterBtn: { paddingHorizontal: 10 },
  counterBtnDisabled: { opacity: 0.5 },
  counterBtnText: { color: "#fff", fontSize: 18 },
  counterValue: { color: "#fff", fontSize: 15, marginHorizontal: 14 },
  notifyBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  notifyCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  notifyTitle: {
    color: "#202124",
    fontSize: 20,
    lineHeight: 28,
    fontFamily: "System",
    fontWeight: "600",
  },
  notifyMessage: {
    marginTop: 10,
    color: "#2F3136",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "System",
    fontWeight: "400",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
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



