import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "../styles/typography";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

export default function Support({ navigation }) {
  const { userId, phone } = useUser();
  const [showCallForm, setShowCallForm] = useState(false);
  const [callName, setCallName] = useState("");
  const [callPhone, setCallPhone] = useState(phone || "");
  const [callProblem, setCallProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const actions = [
    {
      id: "email",
      icon: require("../../assets/icons/email.png"),
      title: "Email Us",
      subtitle: "Need detailed help? Send us an email anytime.",
    },
    {
      id: "chat",
      icon: require("../../assets/icons/chat.png"),
      title: "Chat With Us",
      subtitle: "Get instant support through live chat.",
    },
    {
      id: "call",
      icon: require("../../assets/icons/phone.png"),
      title: "Call Us",
      subtitle: "Prefer to talk to us directly? Give us a call.",
    },
  ];

  const handleActionPress = (id) => {
    if (id === "chat") {
      navigation.navigate("SupportChat");
    } else if (id === "email") {
      Alert.alert("Email Support", "Drop us a note at support@u1r.com");
    } else if (id === "call") {
      setShowCallForm(true);
    }
  };

  const submitCallTicket = async () => {
    if (!callName.trim() || !callPhone.trim() || !callProblem.trim()) {
      Alert.alert("Missing info", "Please fill name, problem, and phone.");
      return;
    }

    if (!userId) {
      Alert.alert("Login required", "Please login again to request a call.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/support/call-ticket`, {
        userId,
        name: callName.trim(),
        phone: callPhone.trim(),
        problem: callProblem.trim(),
      });

      setShowCallForm(false);
      setCallProblem("");
      Alert.alert("Request submitted", "An agent will contact you shortly.");
    } catch (error) {
      Alert.alert("Error", "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <LinearGradient
        colors={["#FFD6D6", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image
            source={require("../../assets/icons/arrow-left.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.heading, styles.headerTitle]}>Support</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        <View style={styles.hero}>
          <Image source={require("../../assets/icons/assist.png")} style={styles.heroIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[Fonts.bodyExtraBold, styles.heroTitle]}>How can we assist</Text>
            <Text style={[Fonts.bodyExtraBold, styles.heroTitle]}>you today ?</Text>
          </View>
        </View>

        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => handleActionPress(action.id)}
          >
            <Image source={action.icon} style={styles.cardIcon} />
            <View style={{ flex: 1 }}>
              <Text style={[Fonts.bodyBold, styles.cardTitle]}>{action.title}</Text>
              <Text style={[Fonts.body, styles.cardSubtitle]}>{action.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        transparent
        visible={showCallForm}
        animationType="slide"
        onRequestClose={() => setShowCallForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[Fonts.bodyBold, styles.modalTitle]}>Request a Call Back</Text>
            <Text style={[Fonts.body, styles.modalSub]}>
              Share your details and a support agent will contact you shortly.
            </Text>

            <TextInput
              placeholder="Your Name"
              placeholderTextColor="#A0A0A0"
              value={callName}
              onChangeText={setCallName}
              style={[Fonts.body, styles.input]}
            />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              value={callPhone}
              onChangeText={setCallPhone}
              style={[Fonts.body, styles.input]}
            />
            <TextInput
              placeholder="Briefly describe the problem"
              placeholderTextColor="#A0A0A0"
              value={callProblem}
              onChangeText={setCallProblem}
              style={[Fonts.body, styles.textArea]}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCallForm(false)}
                style={[styles.modalBtn, styles.modalBtnOutline]}
                disabled={submitting}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnTextOutline]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCallTicket}
                style={[
                  styles.modalBtn,
                  submitting ? styles.modalBtnDisabled : styles.modalBtnSolid,
                ]}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[Fonts.bodyBold, styles.modalBtnTextSolid]}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { padding: 6 },
  headerIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { color: "#000" },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    padding: 14,
    marginBottom: 12,
  },
  heroIcon: { width: 60, height: 60, resizeMode: "contain" },
  heroTitle: { fontSize: 18, color: "#000" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 12,
    marginBottom: 10,
  },
  cardIcon: { width: 36, height: 36, resizeMode: "contain" },
  cardTitle: { fontSize: 14, color: "#000" },
  cardSubtitle: { fontSize: 12, color: "#7A7A7A", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: { fontSize: 18, color: "#000" },
  modalSub: { color: "#6B6B6B", lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#000",
    backgroundColor: "#FAFAFA",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.4,
  },
  modalBtnOutline: {
    borderColor: "#F24B4B",
    backgroundColor: "#fff",
  },
  modalBtnSolid: {
    borderColor: "#F24B4B",
    backgroundColor: "#F24B4B",
  },
  modalBtnDisabled: {
    borderColor: "#F7A6A6",
    backgroundColor: "#F7A6A6",
  },
  modalBtnTextOutline: { color: "#F24B4B" },
  modalBtnTextSolid: { color: "#fff" },
});
