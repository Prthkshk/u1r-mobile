import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

export default function SubCategoryScreen({ navigation, route }) {
  const { categoryId, categoryName } = route.params;

  const [subcats, setSubcats] = useState([]);

  const fetchSubCats = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/public/subcategories/${categoryId}`
      );
      setSubcats(res.data);
    } catch (err) {
      console.log("SUB CATEGORY ERROR:", err);
    }
  };

  useEffect(() => {
    fetchSubCats();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
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

          <Text style={[Fonts.heading, styles.title]}>
            {categoryName}
          </Text>

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

        {/* SUBCATEGORY GRID */}
        <View style={styles.grid}>
          {subcats.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.box}
              onPress={() =>
                navigation.navigate("ProductListScreen", {
                  categoryName: item.name,
                  subcategoryId: item._id,
                  categoryId: null,
                })
              }
            >
              <Image
                source={{
                  uri: withBaseUrl(item.image || ""),
                }}
                style={styles.img}
              />
              <Text style={[Fonts.bodyBold, styles.label]}>
                {item.name}
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
  header: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  icon: { width: 26, height: 26, tintColor: "#000", resizeMode: "contain" },
  searchIcon: { width: 30, height: 30, tintColor: "#000", resizeMode: "contain" },

  title: {
    fontSize: 20,
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
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    padding: 10,
    alignItems: "center",
  },

  img: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },

  label: {
    marginTop: 6,
    fontSize: 15,
    color: "#000",
    textAlign: "center",
  },
});
