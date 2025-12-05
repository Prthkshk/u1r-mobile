import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Linking,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";
import { sendOtp } from "../../services/authService";
import { useUser } from "../../context/UserContext";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const { setPhone: setUserPhone } = useUser();

  const handleContinue = async () => {
    if (phone.length !== 10) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setUserPhone(phone);
      await sendOtp(phone);
      navigation.navigate("Otp", { phone });
    } catch (err) {
      console.log(err);
      alert("Failed to send OTP");
    }
  };

  const openLink = (url) => Linking.openURL(url).catch(() => {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* TOP BANNER IMAGE */}
      <ImageBackground
        source={require("../../assets/images/login-food.png")}
        style={styles.hero}
        imageStyle={styles.heroImage}
      />

      {/* BOTTOM WHITE SHEET */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheet}
      >
        <Text style={[Fonts.heading, styles.sheetTitle]}>
          Sign Up or Login
        </Text>

        <Text style={[Fonts.body, styles.sheetSubtitle]}>
          Enter your mobile number to continue shopping
        </Text>

        {/* PHONE INPUT */}
        <TextInput
          style={[Fonts.body, styles.input]}
          placeholder="Enter Phone Number"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        {/* OTP BUTTON */}
        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={[Fonts.bodyBold, styles.btnText]}>Get OTP</Text>
        </TouchableOpacity>

        {/* TERMS */}
        <Text style={[Fonts.body, styles.termsText]}>
          By Logging into this app, you agree to our{" "}
          <Text
            style={styles.link}
            onPress={() => openLink("https://example.com/terms")}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            style={styles.link}
            onPress={() => openLink("https://example.com/privacy")}
          >
            Privacy Policy
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: "58%",
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f7f7f7",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 42,
    borderTopWidth: 1,
    borderColor: "#DCDCDC",
  },

  sheetTitle: {
    fontSize: 26,
    marginBottom: 6,
    color: "#000",
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
    fontSize: 15,
    color: "#111",
  },

  btn: {
    backgroundColor: "#FF2E2E",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 22,
  },

  btnText: {
    color: "#fff",
    fontSize: 17,
  },

  termsText: {
    fontSize: 12,
    color: "#444",
    lineHeight: 18,
  },

  link: {
    color: "#1a73e8",
    fontWeight: "600",
  },
});
