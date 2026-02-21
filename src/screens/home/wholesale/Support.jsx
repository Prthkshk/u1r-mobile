import React, { useCallback, useMemo, useState } from "react";
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
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "../../styles/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../../../context/UserContext";
import EmailIcon from "../../../assets/icons/email.svg";
import ChatIcon from "../../../assets/icons/chat.svg";
import PhoneIcon from "../../../assets/icons/phone.svg";
import {
  fetchSupportChat,
  submitSupportCallTicket,
} from "../../../services/supportService";

export default function Support({ navigation }) {
  const { userId, phone } = useUser();
  const SUPPORT_EMAIL = "support@u1r.com";
  const [showCallForm, setShowCallForm] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [callName, setCallName] = useState("");
  const [callPhone, setCallPhone] = useState(phone || "");
  const [callProblem, setCallProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [chatMeta, setChatMeta] = useState({
    loading: false,
    unreadCount: 0,
    lastLine: "Get instant support through live chat.",
  });

  const seenKey = useMemo(
    () => `support_last_seen_${userId || "guest"}`,
    [userId]
  );

  const actions = [
    {
      id: "email",
      iconType: "svg",
      iconSvg: EmailIcon,
      title: "Email Us",
      subtitle: "Need detailed help? Send us an email anytime.",
    },
    {
      id: "chat",
      iconType: "svg",
      iconSvg: ChatIcon,
      title: "Chat With Us",
      subtitle: chatMeta.lastLine,
      badge: chatMeta.unreadCount,
    },
    {
      id: "call",
      iconType: "svg",
      iconSvg: PhoneIcon,
      title: "Call Us",
      subtitle: "Prefer to talk to us directly? Give us a call.",
    },
  ];

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadChatMeta = async () => {
        if (!userId) {
          if (!active) return;
          setChatMeta({
            loading: false,
            unreadCount: 0,
            lastLine: "Login to chat with support instantly.",
          });
          return;
        }

        setChatMeta((prev) => ({ ...prev, loading: true }));
        try {
          const [chatRes, seenValue] = await Promise.all([
            fetchSupportChat(userId),
            AsyncStorage.getItem(seenKey),
          ]);

          const chatMessages =
            chatRes?.data?.messages || chatRes?.data?.chat?.messages || [];
          const lastMessage = chatMessages[chatMessages.length - 1];
          const lastLine = lastMessage?.text
            ? String(lastMessage.text)
            : "Get instant support through live chat.";
          const seenTimestamp = seenValue ? new Date(seenValue).getTime() : 0;
          const unreadCount = chatMessages.filter((msg) => {
            const ts = new Date(msg?.timestamp || 0).getTime();
            return msg?.sender === "admin" && ts > seenTimestamp;
          }).length;

          if (!active) return;
          setChatMeta({
            loading: false,
            unreadCount,
            lastLine:
              unreadCount > 0
                ? `${unreadCount} new support ${unreadCount > 1 ? "messages" : "message"}`
                : lastLine.length > 65
                ? `${lastLine.slice(0, 62)}...`
                : lastLine,
          });
        } catch {
          if (!active) return;
          setChatMeta({
            loading: false,
            unreadCount: 0,
            lastLine: "Get instant support through live chat.",
          });
        }
      };

      loadChatMeta();
      return () => {
        active = false;
      };
    }, [seenKey, userId])
  );

  const handleActionPress = async (id) => {
    if (id === "chat") {
      if (userId) {
        try {
          await AsyncStorage.setItem(seenKey, new Date().toISOString());
        } catch {
          // ignore cache write failures
        }
      }
      navigation.navigate("SupportChat");
    } else if (id === "email") {
      setShowEmailPopup(true);
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
      await submitSupportCallTicket({
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }} edges={["bottom"]}>
      <LinearGradient
        colors={["#FFD6D6", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.heading, styles.headerTitle]}>Support</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        <View style={styles.hero}>
          <Image source={require("../../../assets/icons/assist.png")} style={styles.heroIcon} />
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
            {action.iconType === "svg" ? (
              <action.iconSvg width={36} height={36} />
            ) : (
              <Image source={action.icon} style={styles.cardIcon} />
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.cardTitleRow}>
                <Text style={[Fonts.bodyBold, styles.cardTitle]}>{action.title}</Text>
                {!!action.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{action.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[Fonts.body, styles.cardSubtitle]}>{action.subtitle}</Text>
              {action.id === "chat" && chatMeta.loading && (
                <Text style={styles.loadingMetaText}>Checking conversation...</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        transparent
        visible={showEmailPopup}
        animationType="fade"
        onRequestClose={() => setShowEmailPopup(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEmailPopup(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <TouchableOpacity
              onPress={() => setShowEmailPopup(false)}
              onPressOut={() => setShowEmailPopup(false)}
              style={styles.emailCloseBtn}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.emailCloseText}>X</Text>
            </TouchableOpacity>
            <Text style={[Fonts.bodyBold, styles.modalTitle]}>Email Support</Text>
            <Text style={[Fonts.body, styles.modalSubInline]}>
              Send your issue details to our support team at:{" "}
              <Text style={[Fonts.bodyBold, styles.emailText]}>{SUPPORT_EMAIL}</Text>
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

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
              style={[Fonts.body, styles.input, { color: "#111" }]}
            />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              value={callPhone}
              onChangeText={setCallPhone}
              style={[Fonts.body, styles.input, { color: "#111" }]}
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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 14, color: "#000" },
  cardSubtitle: { fontSize: 12, color: "#7A7A7A", marginTop: 4 },
  loadingMetaText: { fontSize: 11, color: "#9A9A9A", marginTop: 4 },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#FF2E2E",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
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
  emailCloseBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 4,
  },
  emailCloseText: {
    color: "#8A8A8A",
    fontSize: 16,
    fontWeight: "700",
  },
  modalTitle: { fontSize: 18, color: "#000" },
  modalSub: { color: "#6B6B6B", lineHeight: 20 },
  modalSubInline: { color: "#6B6B6B", lineHeight: 22, marginTop: 6, paddingRight: 20 },
  emailText: { color: "#F24B4B", fontSize: 15 },
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
