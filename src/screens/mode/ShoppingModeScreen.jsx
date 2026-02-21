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
import { selectMode as selectModeApi } from "../../services/userService";
import { useUser } from "../../context/UserContext";
import { checkStatus } from "../../services/wholesaleService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RetailIcon from "../../assets/icons/retail.svg";

export default function ShoppingModeScreen({ navigation, route }) {
  const { userId, setUser, phone: storedPhone, selectMode } = useUser();
  const phone = route?.params?.phone || storedPhone;
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

  const resolvePhone = async () => {
    if (phone) return phone;
    try {
      const cached = await AsyncStorage.getItem("userPhone");
      return cached || "";
    } catch {
      return "";
    }
  };

  const isValidObjectId = (value = "") => /^[a-fA-F0-9]{24}$/.test(String(value));

  const updateModeOnServer = async (modeCode, safePhone) => {
    const canUseUserId = isValidObjectId(userId);

    if (canUseUserId) {
      try {
        return await selectModeApi({ userId, mode: modeCode, phone: safePhone });
      } catch (err) {
        // Retry by phone when stored userId is stale/invalid after app restart.
        const status = err?.response?.status;
        const message = String(err?.response?.data?.message || "").toLowerCase();
        const shouldRetryWithPhone =
          !!safePhone &&
          (status === 400 ||
            status === 404 ||
            status === 500 ||
            message.includes("required") ||
            message.includes("not found") ||
            message.includes("invalid") ||
            message.includes("cast"));

        if (!shouldRetryWithPhone) throw err;
      }
    }

    return selectModeApi({ mode: modeCode, phone: safePhone });
  };

  const handleWholesale = async () => {
    const safePhone = await resolvePhone();
    if (!safePhone) {
      alert("Please login again.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    const normalized = "wholesale";
    console.log("[ShoppingMode] selecting mode:", normalized);
    const proceed = async (nextUserId, statusCompletedOverride) => {
      const payload = { phone: safePhone };
      if (nextUserId) payload.userId = nextUserId;
      await setUser(payload);
      await selectMode(normalized);
      let isB2bComplete = statusCompletedOverride ?? b2bComplete;
      if (!isB2bComplete && nextUserId) {
        try {
          const statusRes = await checkStatus(nextUserId);
          isB2bComplete = !!statusRes?.data?.completed;
        } catch {
          // keep fallback value
        }
      }
      if (isB2bComplete) {
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeTabs" }],
        });
      } else {
        navigation.navigate("RegisterStep1", { phone: safePhone });
      }
    };
    try {
      setLoading(true);
      const canCheckNow = isValidObjectId(userId);
      const statusPromise = canCheckNow
        ? checkStatus(userId).catch(() => null)
        : Promise.resolve(null);
      const modePromise = updateModeOnServer("B2B", safePhone);

      const [statusRes, modeRes] = await Promise.all([statusPromise, modePromise]);
      const nextUserId = modeRes?.data?.user?._id || userId || "";
      const statusCompleted = !!statusRes?.data?.completed;
      await proceed(nextUserId, statusCompleted);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message;
      if (message === "userId and mode are required" || message === "userId or phone is required") {
        await proceed(userId);
        return;
      }
      if (message === "User not found" || err?.response?.status === 404) {
        // Some backends return 404 for mode sync even when local session is valid.
        if (safePhone) {
          await proceed(userId || "");
          return;
        }
        await setUser({ phone: "", userId: "", mode: "" });
        alert("Session expired. Please login again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
      console.log("Select mode error", err?.response?.data || err?.message);
      alert("Could not update mode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetail = async () => {
    const safePhone = await resolvePhone();
    if (!safePhone) {
      alert("Please login again.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    const normalized = "retail";
    console.log("[ShoppingMode] selecting mode:", normalized);
    const proceed = async (nextUserId) => {
      const payload = { phone: safePhone };
      if (nextUserId) payload.userId = nextUserId;
      await setUser(payload);
      await selectMode(normalized);
      navigation.reset({
        index: 0,
        routes: [{ name: "HomeTabs" }],
      });
    };
    try {
      setLoading(true);
      await proceed(userId || "");
      updateModeOnServer("B2C", safePhone)
        .then(async (res) => {
          const nextUserId = res?.data?.user?._id;
          if (nextUserId && nextUserId !== userId) {
            await setUser({ userId: nextUserId });
          }
        })
        .catch((err) => {
          console.log("Retail mode sync warning", err?.response?.data || err?.message);
        });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message;
      if (message === "userId and mode are required" || message === "userId or phone is required") {
        await proceed(userId);
        return;
      }
      if (message === "User not found" || err?.response?.status === 404) {
        await setUser({ phone: "", userId: "", mode: "" });
        alert("Session expired. Please login again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }
      console.log("Select mode error", err?.response?.data || err?.message);
      alert("Could not update mode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[Fonts.heading, styles.heading]}>
        Choose Your Shopping Mode
      </Text>

      <Text style={[Fonts.body, styles.subHeading]}>
        Select how you’d like to shop: buy in bulk for your business or choose everyday items for personal use.
      </Text>

      <TouchableOpacity
        style={[styles.card, styles.wholesaleCard, loading && styles.cardDisabled]}
        onPress={handleWholesale}
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
              Buy large quantities at lower prices, just for business
            </Text>
          </View>
        </View>

        <Image
          source={require("../../assets/icons/arrow-right.png")}
          style={styles.wholesaleArrow}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.retailCard, loading && styles.cardDisabled]}
        onPress={handleRetail}
        disabled={loading}
      >
        <View style={styles.leftSection}>
          <RetailIcon width={45} height={45} fill="#FFFFFF" />

          <View style={{ flexShrink: 1 }}>
            <Text style={[Fonts.bodyExtraBold, styles.retailTitle]}>
              Shop Retail Items
            </Text>
            <Text style={[Fonts.body, styles.retailText]}>
              Shop everyday items for your home and personal use one at a time
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
    backgroundColor: "#fff",
    padding: 22,
  },

  heading: {
    fontSize: 26,
    marginTop: 10,
    color: "#000",
  },

  subHeading: {
    fontSize: 14,
    color: "#747474",
    marginTop: 10,
    marginBottom: 22,
    lineHeight: 20,
  },

  card: {
    width: "100%",
    minHeight: 140,
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

  cardDisabled: {
    opacity: 0.6,
  },

  retailCard: {
    backgroundColor: "#F52F2F",
    borderWidth: 3,
    borderColor: "#B80000",
    shadowColor: "#F52F2F",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  retailTitle: {
    fontSize: 18,
    color: "#fff",
  },

  retailText: {
    fontSize: 13,
    color: "#fff",
    marginTop: 3,
    lineHeight: 18,
  },

  retailArrow: {
    width: 28,
    height: 28,
    tintColor: "#fff",
  },

  wholesaleCard: {
    backgroundColor: "#FFD43B",
    borderWidth: 2,
    borderColor: "#D7A900",
    shadowColor: "#FFD43B",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  wholesaleIcon: {
    width: 45,
    height: 45,
    tintColor: "#B89A00",
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
});
