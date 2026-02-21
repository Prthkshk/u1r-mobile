import React, { useEffect, useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import { useUser } from "../../../context/UserContext";

const placeholder = require("../../../assets/images/placeholder.png");

export default function SubCategoryScreen({ navigation, route }) {
  const { mode: userMode } = useUser();
  const { categoryId, categoryName, mode: incomingMode } = route.params || {};
  const mode = incomingMode || userMode || "wholesale";

  const [subcats, setSubcats] = useState([]);
  const cacheKey = `wholesale_subcats_${categoryId}`;

  const fetchSubCats = async () => {
    try {
      let res;
      try {
        const url = `${API_BASE_URL}/api/wholesale/categories/${categoryId}/subcategories`;
        res = await axios.get(url, { params: { mode } });
      } catch (err) {
        if (err?.response?.status === 404) {
          // Fallback for older backend: use public subcategories with wholesale mode
          res = await axios.get(
            `${API_BASE_URL}/api/public/subcategories/${categoryId}`,
            { params: { mode: "wholesale" } }
          );
        } else {
          throw err;
        }
      }
      const incoming = res.data?.data || res.data || [];
      setSubcats(incoming);
      AsyncStorage.setItem(cacheKey, JSON.stringify(incoming)).catch(() => {});
    } catch (err) {
      console.log("SUB CATEGORY ERROR:", err?.response?.data || err?.message);
    }
  };

  useEffect(() => {
    let isActive = true;
    AsyncStorage.getItem(cacheKey)
      .then((data) => {
        if (!isActive || !data) return;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubcats(parsed);
        }
      })
      .catch(() => {});
    fetchSubCats();
    return () => {
      isActive = false;
    };
  }, [categoryId]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      edges={["bottom"]}
    >
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
              source={require("../../../assets/icons/arrow-left.png")}
              style={styles.icon}
            />
          </TouchableOpacity>

          <Text style={[Fonts.heading, styles.title]}>
            {categoryName}
          </Text>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity onPress={() => navigation.navigate("Search")} style={{ padding: 4 }}>
              <SearchIcon width={26} height={26} style={styles.searchIcon} />
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
                  mode,
                })
              }
            >
              <Image
                source={
                  item.image || item.imageUrl
                    ? { uri: withBaseUrl(item.image || item.imageUrl) }
                    : placeholder
                }
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
  searchIcon: { width: 26, height: 26, tintColor: "#000", resizeMode: "contain" },

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



