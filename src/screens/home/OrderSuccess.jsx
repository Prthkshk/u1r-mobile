import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";

export default function OrderSuccess({ navigation }) {
  const handleContinue = () => {
    navigation.navigate("HomeTabs", { screen: "HomeB2B" });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require("../../assets/icons/success.png")}
            style={styles.successIcon}
          />

          <Text style={[Fonts.bodyExtraBold, styles.title]}>Order Confirmed</Text>
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

        <View style={styles.infoBox}>
          <Text style={[Fonts.bodyBold, styles.infoText]}>
            Our Team will contact you soon
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  content: {
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: -7,
  },
  title: { fontSize: 22, color: "#2D2D2D" },
  subtitle: {
    fontSize: 13,
    color: "#4A4A4A",
    textAlign: "center",
    marginTop: -15,
  },
  continueBtn: {
    marginTop: -4,
    backgroundColor: "#FF3B3B",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 210,
    alignItems: "center",
  },
  continueText: { color: "#fff", fontSize: 15 },
  infoBox: {
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#6BCF74",
    backgroundColor: "#ECFFEF",
    paddingVertical: 14,
    marginTop: 11,
  },
  infoText: {
    fontSize: 13,
    color: "#2E9E3B",
    textAlign: "center",
  },
});
