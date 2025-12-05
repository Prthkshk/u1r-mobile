import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { Fonts } from "../styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

export default function CategoryScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/public/categories`);
      setCategories(res.data);
    } catch (err) {
      console.log("CATEGORY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color="#FF2E2E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* HEADER */}
        <LinearGradient
          colors={["#FFCACA", "#FFFFFF"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require("../../assets/icons/arrow-left.png")}
              style={styles.icon}
            />
          </TouchableOpacity>

          <Text style={[Fonts.heading, styles.title]}>Categories</Text>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity onPress={() => navigation.navigate("Search")} style={{ padding: 4 }}>
              <Image
                source={require("../../assets/icons/search.png")}
                style={styles.searchIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("HomeTabs", { screen: "Cart" })}
              style={{ padding: 4 }}
            >
              <Image
                source={require("../../assets/icons/cart2.png")}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* CATEGORY GRID */}
        <View style={styles.grid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={styles.box}
              onPress={() =>
                navigation.navigate("CategoryNavigator", {
                  categoryId: cat._id,
                  categoryName: cat.name,
                })
              }
            >
              <Image
                source={
                  cat.image
                    ? { uri: withBaseUrl(cat.image) }
                    : require("../../assets/images/placeholder.png")
                }
                style={styles.img}
              />

              <Text style={[Fonts.bodyBold, styles.label]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f5f5f5" },

  loaderBox: {
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
  },

  icon: {
    width: 26,
    height: 26,
    tintColor: "#000",
    resizeMode: "contain",
  },
  searchIcon: {
    width: 30,
    height: 30,
    tintColor: "#000",
    resizeMode: "contain",
  },

  title: {
    fontSize: 22,
    color: "#000",
  },

  grid: {
    paddingHorizontal: 12,
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },

  box: {
    width: 106,
    height: 137,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    marginBottom: 15,
    alignItems: "center",
    paddingTop: 10,
  },

  img: {
    width: 95,
    height: 95,
  },

  label: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
    maxWidth: 100,
    lineHeight: 16,
  },
});
