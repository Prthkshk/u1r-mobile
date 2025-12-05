import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";
import { useCart } from "../../context/CartContext";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

export default function ProductListScreen({ navigation, route }) {
  const { categoryId, categoryName, subcategoryId } = route.params;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartItems, addToCart, incrementItem, decrementItem } = useCart();

  const getMinQty = (item) => Math.max(Number(item?.moq) || 0, 1);
  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;

  const fetchProducts = async () => {
    try {
      let url = "";

      if (subcategoryId) {
        url = `${API_BASE_URL}/api/public/products/subcategory/${subcategoryId}`;
      } else {
        url = `${API_BASE_URL}/api/public/products/category/${categoryId}`;
      }

      const res = await axios.get(url);
      setProducts(res.data);
    } catch (err) {
      console.log("PRODUCT LIST ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF2E2E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F5" }}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]} // 👈 HEADER STICKY
      >

        {/* ───────────── STICKY HEADER ───────────── */}
        <View>
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
                source={require("../../assets/icons/arrow-left.png")}
                style={styles.icon}
              />
            </TouchableOpacity>

            <Text style={[Fonts.heading, styles.title]}>{categoryName}</Text>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Search")}
                style={styles.iconBtn}
              >
                <Image
                  source={require("../../assets/icons/search.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("HomeTabs", { screen: "Cart" })}
                style={styles.iconBtn}
              >
                <Image
                  source={require("../../assets/icons/cart2.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        {/* ───────────── END HEADER ───────────── */}

        {/* PRODUCT LIST */}
        {products.map((item) => {
          const id = item._id || item.id;
          const cartEntry = cartItems.find((c) => c.id === id);
          const canDecrement = (Number(cartEntry?.qty) || 0) > 0;

          return (
            <TouchableOpacity
              key={id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("ProductDetail", {
                  product: item,
                })
              }
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
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </View>

              <View style={styles.rightCol}>
                <Image
                  source={{
                    uri: withBaseUrl(item.image || ""),
                  }}
                  style={styles.productImg}
                />

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
                      <Text style={[Fonts.bodyBold, styles.counterBtnText]}>
                        -
                      </Text>
                    </TouchableOpacity>

                    <Text style={[Fonts.bodyBold, styles.counterValue]}>
                      {cartEntry.qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => incrementItem(cartEntry.id)}
                      style={styles.counterBtn}
                    >
                      <Text style={[Fonts.bodyBold, styles.counterBtnText]}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addToCart({ ...item, qty: getMinQty(item) })}
                  >
                    <Text style={[Fonts.bodyBold, styles.addBtnText]}>
                      Add to Cart
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },

  iconBtn: {
    padding: 4,
  },

  icon: {
    width: 26,
    height: 26,
    tintColor: "#000",
    resizeMode: "contain",
  },

  title: {
    fontSize: 20,
    color: "#000",
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
  },

  addBtnText: {
    color: "#FF2E2E",
    fontSize: 15,
  },

  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2E2E",
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: "flex-start",
  },

  counterBtn: {
    paddingHorizontal: 9,
  },

  counterBtnDisabled: {
    opacity: 0.4,
  },

  counterBtnText: {
    color: "#fff",
    fontSize: 18,
  },

  counterValue: {
    color: "#fff",
    fontSize: 15,
    marginHorizontal: 16,
  },
});
