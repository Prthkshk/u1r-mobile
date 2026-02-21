import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";

export default function OrderSuccess({ navigation }) {
  const handleContinue = () => {
    navigation.navigate("HomeTabs", { screen: "Home" });
  };

  const handleSupport = () => {
    navigation.navigate("Support");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.screen}>
        <View style={styles.card}>
          <View style={styles.content}>
            <Image
              source={require("../../../assets/icons/success.png")}
              style={styles.successIcon}
            />
            <Text style={[Fonts.bodyExtraBold, styles.title]}>
              Order Confirmed
            </Text>
            <Text style={[Fonts.bodyBold, styles.subtitle]}>
              Your order has been successfully placed.
            </Text>

            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.9}
              onPress={handleContinue}
            >
              <Text style={[Fonts.bodyBold, styles.continueText]}>
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[Fonts.bodyBold, styles.footerText]}>
              Have any questions. Reach directly to our{" "}
              <Text style={styles.supportText} onPress={handleSupport}>
                Customer Support
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingVertical: 48,
    paddingHorizontal: 22,
    minHeight: 520,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  successIcon: {
    width: 78,
    height: 78,
    resizeMode: "contain",
  },
  title: {
    fontSize: 20,
    color: "#2D2D2D",
  },
  subtitle: {
    fontSize: 12.5,
    color: "#6B6B6B",
    textAlign: "center",
    marginTop: -8,
  },
  continueBtn: {
    marginTop: 10,
    backgroundColor: "#FF3B3B",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    minWidth: 210,
    alignItems: "center",
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 14.5,
  },
  footer: {
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 11.5,
    color: "#7A7A7A",
    textAlign: "center",
    lineHeight: 16,
  },
  supportText: {
    color: "#16A34A",
  },
});
