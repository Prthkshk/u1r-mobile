import React from "react";
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
import { Fonts } from "../styles/typography";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { withBaseUrl } from "../../config/api";

const placeholder = require("../../assets/images/placeholder.png");

export default function WishlistScreen({ navigation }) {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const normalizeImage = (uri) => (uri ? withBaseUrl(uri) : null);

  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <LinearGradient
        colors={["#FFD3D3", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image
            source={require("../../assets/icons/arrow-left.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <Text style={[Fonts.heading, styles.headerTitle]}>Wishlist</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate("Search")}
          >
            <Image
              source={require("../../assets/icons/search.png")}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate("HomeTabs", { screen: "Cart" })}
          >
            <Image
              source={require("../../assets/icons/cart2.png")}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }}>
        {items.length === 0 ? (
          <Text style={[Fonts.bodyBold, styles.emptyText]}>No items in wishlist</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("ProductDetail", {
                  product: item,
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

                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    const minQty = getMinQty(item);
                    addToCart({
                      ...item,
                      id: item.id || item._id,
                      moq: minQty,
                      qty: minQty,
                    });
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={[Fonts.bodyBold, styles.addBtnText]}>Add to Cart</Text>
                </TouchableOpacity>
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
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
    alignSelf: "flex-start",
    borderWidth: 1.2,
    borderColor: "#F24B4B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addBtnText: { color: "#F24B4B", fontSize: 12 },
  image: { width: 82, height: 82, borderRadius: 10 },
  heartBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    padding: 6,
  },
});
