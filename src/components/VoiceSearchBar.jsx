import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Voice from "@react-native-voice/voice";
import MicIcon from "../assets/icons/mic.svg";

export default function VoiceSearchBar({
  searchText,
  setSearchText,
  onSearch,
  placeholder = "Search here ...",
  autoFocus = false,
  micFill = "#111",
  autoStartVoice = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const autoStopTimerRef = useRef(null);
  const hasAutoStartedRef = useRef(false);

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const stopListening = async () => {
    clearAutoStopTimer();
    try {
      await Voice.stop();
    } catch (err) {
      console.log("Voice stop error:", err);
    } finally {
      setIsListening(false);
    }
  };

  const startListening = async () => {
    if (isListening) return;

    try {
      setIsListening(true);
      await Voice.start("en-IN");

      autoStopTimerRef.current = setTimeout(() => {
        stopListening();
      }, 10000);
    } catch (err) {
      console.log("Voice start error:", err);
      setIsListening(false);
      clearAutoStopTimer();
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const spokenText = event?.value?.[0] || "";
      setSearchText(spokenText);
      onSearch(spokenText);
      setIsListening(false);
      clearAutoStopTimer();
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      clearAutoStopTimer();
    };

    Voice.onSpeechError = (event) => {
      console.log("Voice recognition error:", event);
      setIsListening(false);
      clearAutoStopTimer();
    };

    return () => {
      clearAutoStopTimer();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onSearch, setSearchText]);

  useEffect(() => {
    if (!autoStartVoice) {
      hasAutoStartedRef.current = false;
      return;
    }

    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;
    startListening();
  }, [autoStartVoice]);

  const handleChangeText = (text) => {
    setSearchText(text);
    onSearch(text);
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInputWrap}>
        <TextInput
          autoFocus={autoFocus}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          value={searchText}
          onChangeText={handleChangeText}
          style={styles.searchInput}
        />
        <View style={styles.inputDivider} />
        <TouchableOpacity
          style={[styles.micBtn, isListening && styles.micBtnActive]}
          onPress={handleMicPress}
        >
          <MicIcon width={21} height={21} fill={isListening ? "#FF2E2E" : micFill} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingLeft: 12,
    paddingVertical: 4,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111", paddingVertical: 0 },
  inputDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
    marginHorizontal: -2,
  },
  micBtn: {
    paddingHorizontal: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  micBtnActive: { backgroundColor: "#FFE5E5" },
});
