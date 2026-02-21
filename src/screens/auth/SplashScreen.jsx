import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../../context/UserContext";

export default function SplashScreen({ navigation }) {
  const { phone, userId, isHydrated, setUserId, setPhone } = useUser();

  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(async () => {
      if (userId) {
        navigation.replace("ShoppingMode");
        return;
      }

      // Fallback: read directly from storage in case context missed it
      try {
        const [savedId, savedPhone] = await Promise.all([
          AsyncStorage.getItem("userId"),
          AsyncStorage.getItem("userPhone"),
        ]);
        if (savedId) {
          if (savedId !== userId) await setUserId(savedId);
          if (savedPhone && savedPhone !== phone) await setPhone(savedPhone);
          navigation.replace("ShoppingMode");
          return;
        }
      } catch {
        // ignore
      }

      navigation.replace("Login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [isHydrated, phone, userId, navigation, setUserId, setPhone]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/u1r-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFF00",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 250,
    height: 250,
  },
});
