import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Fonts } from "../styles/typography";
import Voice from "@react-native-voice/voice";
import { API_BASE_URL, withBaseUrl } from "../../config/api";

const placeholder = require("../../assets/images/placeholder.png");

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
   const [listening, setListening] = useState(false);

  const popular = ["Badam Giri 8Pc", "Kaju JK (Kollam)", "MDH Garam Masala"];

  const onSearch = async (text) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/public/search`, {
        params: { q: text },
      });
      setResults(res.data || []);
    } catch (err) {
      console.log("SEARCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // Voice setup
  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const text = event.value?.[0] || "";
      setQuery(text);
      if (text) {
        onSearch(text);
      }
    };
    Voice.onSpeechError = () => {
      setListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setListening(true);
      await Voice.start("en-US");
    } catch (err) {
      console.log("VOICE START ERROR:", err);
      setListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (err) {
      console.log("VOICE STOP ERROR:", err);
    } finally {
      setListening(false);
    }
  };

  const handleMicPress = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderCard = (item) => (
    <TouchableOpacity
      key={item._id}
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate("ProductDetail", {
          product: item,
        })
      }
    >
      <View style={styles.cardInfo}>
        <Text style={[Fonts.bodyBold, styles.cardTitle]}>{item.name}</Text>
        <Text style={[Fonts.body, styles.cardWeight]}>
          {item.weight || "1 Kg"}
        </Text>
        <View style={styles.cardPriceRow}>
          <Text style={[Fonts.bodyBold, styles.cardPrice]}>{`\u20B9${item.price}`}</Text>
        </View>
      </View>

      <View style={styles.cardAside}>
        <Image
          source={
            item.image
              ? { uri: withBaseUrl(item.image) }
              : placeholder
          }
          style={styles.cardImg}
        />

        <TouchableOpacity style={styles.addBtn}>
          <Text style={[Fonts.bodyBold, styles.addBtnText]}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* <Text style={styles.screenTitle}>Search</Text> */}

      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Image
            source={require("../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <View style={styles.searchInputWrap}>
          <TextInput
            placeholder="Search here ..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={onSearch}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={[styles.micBtn, listening && styles.micBtnActive]}
            activeOpacity={0.8}
            onPress={handleMicPress}
          >
            <Image
              source={require("../../assets/icons/mic.png")}
              style={[
                styles.micIcon,
                listening && styles.micIconActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {query.length === 0 ? (
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
              <Image
                source={require("../../assets/icons/search.png")}
                style={styles.popularIcon}
              />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  screenTitle: { color: "#AAA", marginBottom: 8 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { width: 18, height: 18, tintColor: "#000" },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingLeft: 10,
    paddingRight: 0,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: "#000",
  },
  micBtn: {
    width: 44,
    height: 44,
    borderLeftWidth: 1,
    borderLeftColor: "#DCDCDC",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: {
    backgroundColor: "#FFF2F2",
  },
  micIcon: {
    width: 20,
    height: 20,
    tintColor: "#000",
    resizeMode: "contain",
  },
  micIconActive: {
    tintColor: "#FF2E2E",
  },
  popularBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  popularTitle: { fontSize: 15, color: "#000", marginBottom: 10 },
  popularRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  popularIcon: { width: 16, height: 16, tintColor: "#000", marginRight: 10 },
  popularText: { fontSize: 14, color: "#555" },
  resultsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, color: "#000" },
  cardWeight: { color: "#999", marginTop: 4 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  cardPrice: { fontSize: 16, color: "#000", marginRight: 8 },
  cardAside: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: 120,
  },
  cardImg: { width: 80, height: 80, borderRadius: 12, marginBottom: 10 },
  addBtn: {
    borderWidth: 1,
    borderColor: "#FF2E2E",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-end",
    backgroundColor: "#fff",
  },
  addBtnText: { color: "#FF2E2E", fontSize: 12 },
});
