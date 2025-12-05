import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "../styles/typography";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

export default function SupportChat({ navigation }) {
  const { userId } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const fetchChat = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/support/chat/${userId}`);
        const chatMessages = res.data?.messages || res.data?.chat?.messages || [];
        setMessages(chatMessages);
      } catch (error) {
        Alert.alert("Error", "Unable to load your support chat right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [userId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (!userId) {
      Alert.alert("Login required", "Please login again to start a support chat.");
      return;
    }

    setSending(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/support/chat/send`, {
        userId,
        text,
      });
      const chatMessages = res.data?.chat?.messages || [];
      setMessages(chatMessages);
      setInput("");
    } catch (error) {
      Alert.alert("Error", "Could not send your message. Please try again.");
    } finally {
      setSending(false);
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
        <Text style={[Fonts.heading, styles.headerTitle]}>Chat With Us</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#FF2E2E" />
            <Text style={[Fonts.body, styles.loaderText]}>Loading your chat...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatArea}
            showsVerticalScrollIndicator={false}
          >
            {!userId && (
              <Text style={[Fonts.body, styles.helperText]}>
                Please login to start a support conversation.
              </Text>
            )}

            {userId && messages.length === 0 && (
              <Text style={[Fonts.body, styles.helperText]}>
                Tell us how we can help you. Our team will reply here.
              </Text>
            )}

            {messages.map((msg, idx) => {
              const sender = msg.sender || msg.from || "user";
              return (
                <View
                  key={msg._id || msg.id || idx}
                  style={[
                    styles.bubbleRow,
                    sender === "user" ? styles.bubbleRowUser : styles.bubbleRowSupport,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      sender === "user" ? styles.bubbleUser : styles.bubbleSupport,
                    ]}
                  >
                    <Text style={[Fonts.body, styles.bubbleText]}>{msg.text}</Text>
                    {msg.timestamp && (
                      <Text style={styles.timeText}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor="#B3B3B3"
            style={[Fonts.body, styles.input]}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (sending || !input.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            activeOpacity={0.85}
            disabled={sending || !input.trim()}
          >
            <Text style={[Fonts.bodyBold, styles.sendText]}>
              {sending ? "Sending..." : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: { color: "#000" },
  chatArea: { padding: 14, paddingBottom: 24 },
  helperText: { textAlign: "center", color: "#7A7A7A", marginTop: 10, lineHeight: 20 },
  bubbleRow: { marginBottom: 12, flexDirection: "row" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowSupport: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  bubbleUser: {
    backgroundColor: "#FFEEEE",
    borderColor: "#FFB6B6",
    borderBottomRightRadius: 4,
  },
  bubbleSupport: {
    backgroundColor: "#fff",
    borderColor: "#E6E6E6",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: "#000", lineHeight: 20 },
  timeText: { color: "#9A9A9A", fontSize: 11 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#EDEDED",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    color: "#000",
  },
  sendBtn: {
    backgroundColor: "#FF2E2E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sendBtnDisabled: { backgroundColor: "#F7A6A6" },
  sendText: { color: "#fff", fontSize: 14 },
});
