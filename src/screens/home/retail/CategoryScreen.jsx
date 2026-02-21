import React, { useEffect, useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
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
import { Fonts } from "../../styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";

export default function CategoryScreenRetail({ navigation }) {
  const mode = "retail";
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const isVisible = (value) => value === true || value === "true" || value === 1;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/retail/categories`, {
          params: { mode },
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          res = await axios.get(`${API_BASE_URL}/api/public/categories`, {
            params: { mode },
          });
        } else {
          throw err;
        }
      }
      const incoming = res?.data?.data || res?.data || [];
      const filtered = incoming.filter(
        (cat) => cat.isRetail === undefined || isVisible(cat.isRetail)
      );
      setCategories(filtered);
    } catch (err) {
      console.log("RETAIL CATEGORY ERROR:", err?.response?.data || err?.message);
      setCategories([]);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }} edges={["bottom"]}>
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
              source={require("../../../assets/icons/arrow-left.png")}
              style={styles.icon}
            />
          </TouchableOpacity>

          <Text style={[Fonts.heading, styles.title]}>Categories</Text>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Search")}
              style={{ padding: 4 }}
            >
              <SearchIcon width={26} height={26} style={styles.searchIcon} />
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
                  mode,
                })
              }
            >
              <Image
                source={
                  cat.image || cat.imageUrl
                    ? { uri: withBaseUrl(cat.image || cat.imageUrl) }
                    : require("../../../assets/images/placeholder.png")
                }
                style={styles.img}
              />

              <Text style={[Fonts.bodyBold, styles.label]}>{cat.name}</Text>
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
    width: 26,
    height: 26,
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



