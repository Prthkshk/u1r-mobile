import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Fonts } from "../styles/typography";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

export default function RequestProduct({ navigation }) {
  const { userId } = useUser();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Enter product name", "Please add a product name.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/api/request-product`, {
        userId,
        name,
        description: [category, description].filter(Boolean).join(" - "),
      });
      Alert.alert("Submitted", "We have received your request.");
      setName("");
      setCategory("");
      setDescription("");
      navigation.goBack();
    } catch (err) {
      console.log("Request product error", err?.response?.data || err?.message);
      Alert.alert("Failed", "Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Image
              source={require("../../assets/icons/arrow-left.png")}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={[Fonts.heading, styles.headerTitle]}>Request Product</Text>
        </View>

        <View style={styles.card}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[Fonts.bodyBold, styles.cardTitle]}>
              Cant Find What you’re looking for ?
            </Text>
            <Text style={[Fonts.body, styles.cardText]}>
              Let us know what item or service you need and we’ll work on making it
              available for you
            </Text>
          </View>
          <Image
            source={require("../../assets/images/request.png")}
            style={styles.cardImage}
          />
        </View>

        <View style={styles.form}>
          <Text style={[Fonts.bodyBold, styles.label]}>
            Explain the product you want
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Product Category"
            value={category}
            onChangeText={setCategory}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={[Fonts.bodyBold, styles.submitText]}>
            {submitting ? "Submitting..." : "Submit"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { fontSize: 18, color: "#000" },
  card: {
    marginHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececec",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, color: "#000", marginBottom: 6 },
  cardText: { fontSize: 12, color: "#555", lineHeight: 16 },
  cardImage: { width: 92, height: 92, resizeMode: "contain" },
  form: { paddingHorizontal: 14, gap: 10 },
  label: { fontSize: 14, color: "#000", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    height: 120,
  },
  footer: {
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ededed",
  },
  submitBtn: {
    backgroundColor: "#FF3B3B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16 },
});
