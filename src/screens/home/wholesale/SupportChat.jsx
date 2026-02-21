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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "../../styles/typography";
import { useUser } from "../../../context/UserContext";
import {
  fetchSupportChat,
  sendSupportMessage,
} from "../../../services/supportService";

export default function SupportChat({ navigation }) {
  const { userId } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const seenKey = `support_last_seen_${userId || "guest"}`;
  const syncTimerRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const normalizeMessages = (incoming = []) =>
    [...incoming]
      .map((msg, idx) => ({
        _id: msg?._id || msg?.id || `server_${idx}_${msg?.timestamp || Date.now()}`,
        sender: msg?.sender || msg?.from || "user",
        text: msg?.text || "",
        timestamp: msg?.timestamp || new Date().toISOString(),
      }))
      .filter((msg) => msg.text)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

  const mergeServerWithPending = (serverMessages) => {
    setMessages((prev) => {
      const pending = prev.filter(
        (msg) => msg?.localStatus === "sending" || msg?.localStatus === "failed"
      );
      return [...serverMessages, ...pending].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  };

  const markAsSeen = async (nextMessages = []) => {
    if (!userId || !nextMessages.length) return;
    const lastMessage = nextMessages[nextMessages.length - 1];
    const seenValue = lastMessage?.timestamp || new Date().toISOString();
    await AsyncStorage.setItem(seenKey, String(seenValue));
  };

  const fetchChat = async ({ silent = false } = {}) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await fetchSupportChat(userId);
      const chatMessages = normalizeMessages(
        res?.data?.messages || res?.data?.chat?.messages || []
      );
      mergeServerWithPending(chatMessages);
      await markAsSeen(chatMessages);
    } catch (error) {
      if (!silent) {
        Alert.alert("Error", "Unable to load your support chat right now.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchChat();
      syncTimerRef.current = setInterval(() => {
        fetchChat({ silent: true });
      }, 5000);

      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
      };
    }, [userId])
  );

  const handleSend = async (retryMessage = null) => {
    const text = (retryMessage?.text || input).trim();
    if (!text) return;

    if (!userId) {
      Alert.alert("Login required", "Please login again to start a support chat.");
      return;
    }

    const tempId = retryMessage?._id || `temp_${Date.now()}`;
    const optimistic = {
      _id: tempId,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
      localStatus: "sending",
    };

    if (retryMessage) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === retryMessage._id ? { ...msg, localStatus: "sending" } : msg
        )
      );
    } else {
      setMessages((prev) => [...prev, optimistic]);
      setInput("");
    }

    setSending(true);

    try {
      const res = await sendSupportMessage({
        userId,
        text,
      });
      const chatMessages = normalizeMessages(res?.data?.chat?.messages || []);
      setMessages(chatMessages);
      await markAsSeen(chatMessages);
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, localStatus: "failed" } : msg
        )
      );
      Alert.alert("Send failed", "Your message was not sent. Tap retry.");
    } finally {
      setSending(false);
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
        <Text style={[Fonts.heading, styles.headerTitle]}>Chat With Us</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.statusBar}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {refreshing ? "Syncing messages..." : "Support team usually replies quickly"}
          </Text>
        </View>

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
              const isFailed = msg?.localStatus === "failed";
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
                    <View style={styles.metaRow}>
                      {msg.timestamp && (
                        <Text style={styles.timeText}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                      {sender === "user" && !isFailed && (
                        <Text style={styles.tickText}>
                          {msg.localStatus === "sending" ? "..." : "sent"}
                        </Text>
                      )}
                    </View>
                    {isFailed && (
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => handleSend(msg)}
                        disabled={sending}
                      >
                        <Text style={styles.retryText}>Retry</Text>
                      </TouchableOpacity>
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
            style={[Fonts.body, styles.input, { color: "#111" }]}
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
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF2F2",
    borderBottomWidth: 1,
    borderColor: "#FFDADA",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
  },
  statusText: { fontSize: 12, color: "#555" },
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { color: "#9A9A9A", fontSize: 11 },
  tickText: { color: "#9A9A9A", fontSize: 11 },
  retryBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#FFE9E9",
    borderWidth: 1,
    borderColor: "#FFC8C8",
  },
  retryText: { color: "#D84141", fontSize: 11, fontWeight: "700" },
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
