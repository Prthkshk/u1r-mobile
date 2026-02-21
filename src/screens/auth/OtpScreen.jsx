import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { sendOtp, verifyOtp } from "../../services/authService";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

export default function OtpScreen({ navigation, route }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const inputRefs = useRef([]);
  const { setUser } = useUser();
  const [timer, setTimer] = useState(60);
  const [resending, setResending] = useState(false);

  const handleChange = (val, index) => {
    setOtpError("");
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) {
      alert("Enter valid OTP");
      return;
    }

    try {
      const res = await verifyOtp(phone, finalOtp);
      const userId = res?.data?.user?._id;
      const userMode = res?.data?.user?.mode;
      if (!userId) {
        alert("Could not fetch user. Please try again.");
        return;
      }

      await setUser({ phone, userId, mode: userMode });
      navigation.reset({
        index: 0,
        routes: [{ name: "ShoppingMode", params: { phone } }],
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "OTP verification failed";
      const normalizedMessage = String(message).toLowerCase();
      if (
        normalizedMessage.includes("invalid otp") ||
        normalizedMessage.includes("incorrect otp") ||
        normalizedMessage.includes("wrong otp") ||
        normalizedMessage.includes("otp is incorrect")
      ) {
        setOtpError("Code is Incorrect");
        return;
      }
      alert(message);
      console.log("VERIFY OTP ERROR:", error?.response?.data || error?.message || error);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    try {
      setResending(true);
      await sendOtp(phone);
      setTimer(60);
      setOtpError("");
    } catch (err) {
      alert("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const formattedTimer = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Image
          source={require("../../assets/icons/arrow-left.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.sub}>Enter OTP sent to {phone}</Text>
        <Text style={styles.terms}>
          By Logging into this app, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(r) => (inputRefs.current[index] = r)}
            style={[
              styles.input,
              otpError ? styles.inputError : null,
              !otpError && digit ? styles.inputFilled : null,
              { color: "#111" },
            ]}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(v) => handleChange(v, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            selectionColor="#111"
          />
        ))}
      </View>
      {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}

      <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
        <Text style={styles.verifyTxt}>Verify</Text>
      </TouchableOpacity>

      <View style={styles.resendWrap}>
        {timer > 0 ? (
          <Text style={styles.resendText}>
            Resend OTP <Text style={styles.timerText}>{formattedTimer}</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
            <Text style={styles.resendTextActive}>
              {resending ? "Sending..." : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  backBtn: { padding: 6, alignSelf: "flex-start" },
  backIcon: { width: 24, height: 24, tintColor: "#000" },
  header: { marginTop: 8, marginBottom: 26 },
  title: { fontSize: 26, fontWeight: "800", color: "#000" },
  sub: { color: "#777", marginTop: 6, marginBottom: 6 },
  terms: { color: "#999", fontSize: 12, lineHeight: 16 },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 18,
    marginBottom: 14,
  },
  input: {
    width: 55,
    height: 65,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: "#ffffff",
    color: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  inputFilled: {
    borderColor: "#000",
  },
  inputError: {
    borderColor: "#FF2E2E",
  },
  errorText: {
    color: "#FF2E2E",
    fontSize: 12,
    marginBottom: 14,
    width: 256,
    alignSelf: "center",
  },
  verifyBtn: {
    backgroundColor: "#FF3B3B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  verifyTxt: { fontSize: 18, fontWeight: "700", color: "#fff" },
  resendWrap: { marginTop: 18, alignItems: "center" },
  resendText: { fontSize: 13, color: "#111" },
  timerText: { color: "#FF2E2E", fontWeight: "600" },
  resendTextActive: { fontSize: 13, color: "#FF2E2E", fontWeight: "700" },
});
