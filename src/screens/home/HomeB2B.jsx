import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Fonts } from "../styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

const { width } = Dimensions.get("window");

export default function HomeB2B({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/public/categories`);
      setCategories(res.data);
    } catch (err) {
      console.log("CATEGORY ERROR:", err);
    }
  };

  // Fetch sliders
  const fetchSliders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sliders`);
      setSliders(res.data);
    } catch (err) {
      console.log("SLIDER ERROR:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchCategories();
      await fetchSliders();
      setLoading(false);
    };
    load();
  }, []);

  // Auto slide
  useEffect(() => {
    if (sliders.length === 0) return;

    const timer = setInterval(() => {
      const next = (activeSlide + 1) % sliders.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveSlide(next);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeSlide, sliders]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#FF2E2E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Gradient Header */}
      <LinearGradient
        colors={["#FFCACA", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      />

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <TouchableOpacity
          style={styles.searchBox}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Search")}
        >
          <Image
            source={require("../../assets/icons/search.png")}
            style={styles.searchIcon}
          />
          <Text style={[Fonts.body, styles.searchPlaceholder]}>
            Search here ...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slider */}
      <ScrollView
        horizontal
        pagingEnabled
        ref={scrollRef}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveSlide(index);
        }}
        showsHorizontalScrollIndicator={false}
        style={styles.sliderScroll}
      >
        {sliders.map((item) => (
          <Image
            key={item._id}
            source={{ uri: withBaseUrl(item.image) }}
            style={styles.sliderImage}
          />
        ))}
      </ScrollView>

      {/* Slider dots */}
      <View style={styles.dotsContainer}>
        {sliders.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, activeSlide === index && styles.activeDot]}
          />
        ))}
      </View>

      {/* Section title */}
      <Text style={[Fonts.heading, styles.sectionTitle]}>
        Shop By Categories
      </Text>

      {/* Category grid */}
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={styles.categoryBox}
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
              style={styles.categoryImage}
              resizeMode="contain"
            />

            <Text style={[Fonts.bodyBold, styles.categoryName]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f6" },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerGradient: {
    width: "100%",
    height: 150,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    position: "absolute",
    top: 0,
  },

  searchWrapper: {
    marginTop: 110,
    paddingHorizontal: 20,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#DCDCDC",
  },

  searchIcon: {
    width: 18,
    height: 18,
    tintColor: "#666",
    marginRight: 10,
  },

  searchPlaceholder: {
    fontSize: 15,
    color: "#777",
  },

  sliderScroll: { marginTop: 20 },

  sliderImage: {
    width: width - 40,
    height: 150,
    marginHorizontal: 20,
    borderRadius: 18,
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },

  dot: {
    width: 8,
    height: 8,
    backgroundColor: "#ccc",
    margin: 4,
    borderRadius: 50,
  },

  activeDot: {
    backgroundColor: "#FF2E2E",
    width: 20,
    borderRadius: 5,
  },

  sectionTitle: {
    fontSize: 24,
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 20,
    color: "#222",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 4,
    rowGap: 4,
  },

  categoryBox: {
    width: 106,
    height: 137,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    marginBottom: 15,
  },

  categoryImage: {
    width: 95,
    height: 95,
  },

  categoryName: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 90,
    lineHeight: 15,
    color: "#000",
  },
});
