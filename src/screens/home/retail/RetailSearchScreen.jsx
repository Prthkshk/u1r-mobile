import React, { useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Fonts } from "../../styles/typography";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import { useCart } from "../../../context/CartContext";
import Cart2Icon from "../../../assets/icons/scart.svg";
import VoiceSearchBar from "../../../components/VoiceSearchBar";

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

const isInStock = (item) => {
  if (item?.stock === undefined || item?.stock === null || item?.stock === "") return true;
  return Number(item.stock) > 0;
};

export default function RetailSearchScreen({ navigation, route }) {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { cartItems, addToCart, incrementItem, decrementItem } = useCart();

  const popular = [
    "Pudina Makhana",
    "Badam Chocodip",
    "Zahdi Dates",
    "Jumbo Mamra",
    "Pumpkin Seeds",
  ];
  const totalItems = cartItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );
  const cartLabel = totalItems === 1 ? "item" : "items";
  const showCartBar = totalItems > 0;

  const onSearch = async (text) => {
    setSearchText(text);
    if (text.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/retail/search`, {
        params: { q: text },
      });
      setResults(res.data?.data || res.data || []);
    } catch (err) {
      console.log("SEARCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);

  const handleAddToCart = (item) => {
    Keyboard.dismiss();
    addToCart({
      ...item,
      id: item._id || item.id,
      moq: getMinQty(item),
      qty: getMinQty(item),
    });
  };

  const handleIncrement = (id) => {
    if (!id) return;
    incrementItem(id);
  };

  const handleDecrement = (id) => {
    if (!id) return;
    decrementItem(id);
  };

  const renderCard = (item) => {
    const { sale, mrp } = getPrices(item);
    const outOfStock = !isInStock(item);
    return (
    <TouchableOpacity
      key={item._id}
      style={styles.card}
      onPress={() =>
        navigation.navigate("RetailProductDetail", {
          product: item,
          productId: item._id || item.id,
          mode: "retail",
        })
      }
    >
      {/*
        Show counter when item exists in cart; otherwise show Add to Cart CTA.
      */}
      <View style={styles.cardInfo}>
        <Text style={[Fonts.bodyBold, styles.cardTitle]}>{item.name}</Text>
        <Text style={[Fonts.body, styles.cardWeight]}>
          {item.weight || "1 Kg"}
        </Text>

        <View style={styles.cardPriceRow}>
          <Text style={[Fonts.bodyBold, styles.cardPrice]}>
            {formatPrice(sale)}
          </Text>
          {!!mrp && <Text style={styles.cardMrp}>{formatPrice(mrp)}</Text>}
        </View>
      </View>

      <View style={styles.cardAside}>
        <Image
          source={item.image ? { uri: withBaseUrl(item.image) } : placeholder}
          style={styles.cardImg}
        />
        {(() => {
          const id = item._id || item.id;
          const cartEntry = cartItems.find((c) => c.id === id);
          const qty = Number(cartEntry?.qty) || 0;

          if (outOfStock) {
            return (
              <View style={styles.outOfStockWrap}>
                <Text style={[Fonts.bodyBold, styles.outOfStockText]}>
                  Out of Stock
                </Text>
              </View>
            );
          }

          if (qty > 0) {
            return (
              <View style={styles.counter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    handleDecrement(id);
                  }}
                >
                  <Text style={[Fonts.bodyBold, styles.counterBtnText]}>-</Text>
                </TouchableOpacity>
                <Text style={[Fonts.bodyBold, styles.counterValue]}>
                  {qty}
                </Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    handleIncrement(id);
                  }}
                >
                  <Text style={[Fonts.bodyBold, styles.counterBtnText]}>+</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              style={styles.addBtn}
              delayPressIn={0}
              onPress={(event) => {
                event?.stopPropagation?.();
                handleAddToCart(item);
              }}
            >
              <Text
                style={[Fonts.bodyBold, styles.addBtnText]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                Add to Cart
              </Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.screen}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: showCartBar ? 120 : 24,
        }}
      >
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require("../../../assets/icons/arrow-left.png")}
              style={styles.backIcon}
            />
          </TouchableOpacity>

          <VoiceSearchBar
            searchText={searchText}
            setSearchText={setSearchText}
            onSearch={onSearch}
            micFill="#5A5A5A"
            autoStartVoice={Boolean(route?.params?.autoStartVoice)}
          />
        </View>

        {searchText.length === 0 ? (
          <View style={styles.popularBox}>
            <Text style={[Fonts.bodyBold, styles.popularTitle]}>
              Popular Searches
            </Text>
            {popular.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.popularRow}
                onPress={() => onSearch(item)}
              >
                <SearchIcon width={14} height={14} style={styles.popularIcon} />
                <Text style={[Fonts.body, styles.popularText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.resultsBox}>
            {loading ? (
              <ActivityIndicator size="small" color="#FF2E2E" />
            ) : (
              results.map(renderCard)
            )}
          </View>
        )}
      </ScrollView>

      {showCartBar && (
        <View style={styles.cartBar}>
          <Text style={[Fonts.bodyBold, styles.cartInfoText]}>
            {totalItems} {cartLabel} in cart
          </Text>
          <TouchableOpacity
            style={styles.cartActionBtn}
            onPress={() =>
              navigation.navigate("HomeTabs", {
                screen: "Cart",
                params: { mode: "retail" },
              })
            }
          >
            <Cart2Icon width={18} height={18} color="#fff" />
            <Text style={[Fonts.bodyBold, styles.cartActionText]}>
              View Cart
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  screen: { flex: 1, backgroundColor: "#FFF", paddingHorizontal: 12, paddingTop: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#FFF",
  },
  backIcon: { width: 24, height: 24, tintColor: "#333" },
  popularBox: { marginTop: 6 },
  popularTitle: { fontSize: 13, color: "#222", marginBottom: 12 },
  popularRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  popularIcon: { width: 14, height: 14, tintColor: "#444", marginRight: 10 },
  popularText: { fontSize: 14, color: "#777" },
  resultsBox: { marginTop: 8 },
  card: { flexDirection: "row", borderWidth: 1, borderColor: "#EEE", borderRadius: 16, padding: 12, marginBottom: 12, backgroundColor: "#FFF" },
  cardInfo: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 15, color: "#000" },
  cardWeight: { color: "#999", marginTop: 4 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  cardPrice: { fontSize: 16, color: "#000", marginRight: 8 },
  cardMrp: {
    fontSize: 13,
    color: "#999",
    textDecorationLine: "line-through",
  },
  cardAside: { alignItems: "flex-end", justifyContent: "space-between", width: 120 },
  cardImg: { width: 80, height: 80, borderRadius: 12, marginBottom: 10 },
  addBtn: {
    borderWidth: 1,
    borderColor: "#FF2E2E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  addBtnText: { color: "#FF2E2E" },
  outOfStockWrap: {
    borderWidth: 1,
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  outOfStockText: { color: "#757575", fontSize: 12 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2E2E",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 12,
  },
  counterBtn: { paddingHorizontal: 4 },
  counterBtnText: { color: "#fff", fontSize: 18 },
  counterValue: { color: "#fff", fontSize: 14, minWidth: 18, textAlign: "center" },
  cartBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  cartInfoText: { color: "#111", flex: 1, fontSize: 13 },
  cartActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2E2E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  cartActionIcon: { width: 18, height: 18, tintColor: "#fff", resizeMode: "contain" },
  cartActionText: { color: "#fff", fontSize: 14 },
});



