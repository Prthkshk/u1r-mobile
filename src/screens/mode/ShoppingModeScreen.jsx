import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Fonts } from "../styles/typography";
import { selectMode } from "../../services/userService";
import { useUser } from "../../context/UserContext";
import { checkStatus } from "../../services/wholesaleService";

export default function ShoppingModeScreen({ navigation, route }) {
  const phone = route?.params?.phone;
  const { userId, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [b2bComplete, setB2bComplete] = useState(false);

  useEffect(() => {
    if (!userId) return;
    checkStatus(userId)
      .then((res) => {
        if (res?.data?.completed) setB2bComplete(true);
      })
      .catch(() => {});
  }, [userId]);

  const handleMode = async (mode) => {
    if (!userId) {
      alert("Please login again.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    try {
      setLoading(true);
      await selectMode({ userId, mode });
      await setUser({ phone, userId, mode });
      if (mode === "B2B") {
        if (b2bComplete) {
          navigation.reset({
            index: 0,
            routes: [{ name: "HomeTabs" }],
          });
        } else {
          navigation.navigate("RegisterStep1", { phone });
        }
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeTabs" }],
        });
      }
    } catch (err) {
      console.log("Select mode error", err?.response?.data || err?.message);
      alert("Could not update mode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Heading */}
      <Text style={[Fonts.heading, styles.heading]}>
        Choose Your Shopping Mode
      </Text>

      <Text style={[Fonts.body, styles.subHeading]}>
        Select how you’d like to shop: buy in bulk for your business or choose
        everyday items for personal use.
      </Text>

      {/* WHOLESALE CARD */}
      <TouchableOpacity
        style={[styles.card, styles.wholesaleCard]}
        onPress={() => handleMode("B2B")}
        disabled={loading}
      >
        <View style={styles.leftSection}>
          <Image
            source={require("../../assets/icons/wholesale.png")}
            style={styles.wholesaleIcon}
            resizeMode="contain"
          />

          <View style={{ flexShrink: 1 }}>
            <Text style={[Fonts.bodyExtraBold, styles.wholesaleTitle]}>
              Wholesale for Business
            </Text>
            <Text style={[Fonts.body, styles.wholesaleText]}>
              Buy large quantities at lower prices, just for businesses
            </Text>
          </View>
        </View>

        <Image
          source={require("../../assets/icons/arrow-right.png")}
          style={styles.wholesaleArrow}
        />
      </TouchableOpacity>

      {/* RETAIL CARD */}
      <TouchableOpacity
        style={[styles.card, styles.retailCard]}
        onPress={() => handleMode("B2C")}
        disabled={loading}
      >
        <View style={styles.leftSection}>
          <Image
            source={require("../../assets/icons/retail.png")}
            style={styles.retailIcon}
            resizeMode="contain"
          />

          <View style={{ flexShrink: 1 }}>
            <Text style={[Fonts.bodyExtraBold, styles.retailTitle]}>
              Shop Retail Items
            </Text>
            <Text style={[Fonts.body, styles.retailText]}>
              Shop everyday items for your home and personal use
            </Text>
          </View>
        </View>

        <Image
          source={require("../../assets/icons/arrow-right.png")}
          style={styles.retailArrow}
        />
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },

  heading: {
    fontSize: 26,
    marginTop: 15,
    color: "#000",
  },

  subHeading: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
    marginBottom: 25,
    lineHeight: 20,
  },

  card: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    width: "80%",
  },

  /* WHOLESALE */
  wholesaleCard: {
    backgroundColor: "#F7C600",
    borderWidth: 3,
    borderColor: "#D4A500",
  },

  wholesaleIcon: {
    width: 45,
    height: 45,
    tintColor: "#A88400",
  },

  wholesaleTitle: {
    fontSize: 18,
    color: "#000",
  },

  wholesaleText: {
    fontSize: 13,
    color: "#444",
    marginTop: 3,
    lineHeight: 18,
  },

  wholesaleArrow: {
    width: 28,
    height: 28,
    tintColor: "#000",
  },

  /* RETAIL */
  retailCard: {
    backgroundColor: "#FF2E2E",
    borderWidth: 3,
    borderColor: "#CC0000",
  },

  retailIcon: {
    width: 45,
    height: 45,
    tintColor: "#FFF",
  },

  retailTitle: {
    fontSize: 18,
    color: "#FFF",
  },

  retailText: {
    fontSize: 13,
    color: "#FFF",
    marginTop: 3,
    lineHeight: 18,
  },

  retailArrow: {
    width: 28,
    height: 28,
    tintColor: "#FFF",
  },
});
