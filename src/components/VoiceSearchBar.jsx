import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as SpeechRecognition from "expo-speech-recognition";
import MicIcon from "../assets/icons/mic.svg";

export default function VoiceSearchBar({
  searchText,
  setSearchText,
  onSearch,
  placeholder = "Search here ...",
  autoFocus = false,
  micFill = "#111",
}) {
  const [isListening, setIsListening] = useState(false);

  const getRecognizerModule = () =>
    SpeechRecognition.ExpoSpeechRecognitionModule || SpeechRecognition;

  const extractTranscript = (payload) => {
    if (!payload) return "";
    if (typeof payload === "string") return payload;
    if (typeof payload.transcription === "string") return payload.transcription;
    if (typeof payload.transcript === "string") return payload.transcript;
    if (typeof payload.text === "string") return payload.text;
    if (Array.isArray(payload.results) && payload.results.length > 0) {
      const first = payload.results[0];
      if (typeof first?.transcript === "string") return first.transcript;
      if (typeof first?.transcription === "string") return first.transcription;
      if (Array.isArray(first) && typeof first[0]?.transcript === "string") {
        return first[0].transcript;
      }
    }
    return "";
  };

  const startListening = async () => {
    if (isListening) return;
    try {
      const recognizer = getRecognizerModule();
      const available =
        typeof recognizer.isRecognitionAvailable === "function"
          ? recognizer.isRecognitionAvailable()
          : typeof SpeechRecognition.hasServicesAsync === "function"
            ? await SpeechRecognition.hasServicesAsync()
            : true;

      if (!available) {
        Alert.alert("Speech recognition not available on this device");
        return;
      }

      if (typeof recognizer.requestPermissionsAsync === "function") {
        const permission = await recognizer.requestPermissionsAsync();
        if (permission && permission.granted === false) {
          Alert.alert("Microphone permission is required for voice search");
          return;
        }
      }

      setIsListening(true);

      if (typeof recognizer.startAsync === "function") {
        const result = await recognizer.startAsync({
          language: "en-IN",
          interimResults: false,
          maxAlternatives: 1,
        });
        const transcript = extractTranscript(result).trim();
        if (transcript) {
          setSearchText(transcript);
          onSearch(transcript);
        }
        setIsListening(false);
        return;
      }

      if (
        typeof recognizer.start === "function" &&
        typeof recognizer.addListener === "function"
      ) {
        let handled = false;
        let resultSub;
        let errorSub;
        let endSub;
        const cleanup = () => {
          resultSub?.remove?.();
          errorSub?.remove?.();
          endSub?.remove?.();
          setIsListening(false);
        };

        resultSub = recognizer.addListener("result", (event) => {
          if (handled) return;
          handled = true;
          const transcript = extractTranscript(event).trim();
          if (transcript) {
            setSearchText(transcript);
            onSearch(transcript);
          }
          if (typeof recognizer.stop === "function") recognizer.stop();
          cleanup();
        });

        errorSub = recognizer.addListener("error", (event) => {
          console.log("Speech error:", event);
          if (!handled) cleanup();
        });

        endSub = recognizer.addListener("end", () => {
          if (!handled) cleanup();
        });

        recognizer.start({
          lang: "en-IN",
          interimResults: false,
          maxAlternatives: 1,
        });
        return;
      }

      throw new Error("Speech recognition API is not available");
    } catch (error) {
      console.log("Speech error:", error);
      setIsListening(false);
    }
  };

  const handleMicPress = () => {
    if (!isListening) {
      startListening();
    }
  };

  const handleChangeText = (text) => {
    setSearchText(text);
    onSearch(text);
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
          <MicIcon
            width={21}
            height={21}
            fill={isListening ? "#FF2E2E" : micFill}
          />
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
