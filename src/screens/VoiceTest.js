import React, { useState } from "react";
import { View, Button } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy"; // FIXED

export default function VoiceTest() {
  const [recording, setRecording] = useState(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.log("Error starting recording:", err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Audio URI:", uri);

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const response = await fetch("http://192.168.29.98:5000/api/voice-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: base64 }),
      });

      const data = await response.json();
      console.log("Transcribed Text:", data.text);
    } catch (err) {
      console.log("Error stopping recording:", err);
    }
  };

  return (
    <View style={{ marginTop: 100 }}>
      <Button title="Start Recording" onPress={startRecording} />
      <Button title="Stop Recording & Send" onPress={stopRecording} />
    </View>
  );
}
