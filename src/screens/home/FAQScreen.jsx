import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";

const faqs = [
  {
    question: "What is U1R?",
    answer: "U1R connects you with quality products and fast delivery tailored for your business needs.",
  },
  {
    question: "Do you offer both wholesale and retail services?",
    answer: "Yes, we cater to both wholesale and retail customers with dedicated pricing and packs.",
  },
  {
    question: "Do you provide next-day delivery?",
    answer: "In many serviceable areas we provide next-day delivery on eligible products.",
  },
  {
    question: "How do I track my order?",
    answer: "You can track your order status from the Orders section in your profile.",
  },
  {
    question: "How can I contact support?",
    answer: "Use in-app chat or call our helpline for quick assistance.",
  },
];

export default function FAQScreen({ navigation }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#FFE9E9", "#FFFFFF"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Image
              source={require("../../assets/icons/arrow-left.png")}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={[Fonts.heading, styles.headerTitle]}>FAQS</Text>
        </LinearGradient>

        <View style={styles.content}>
          {faqs.map((item, idx) => {
            const open = openIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.card, open && styles.cardOpen]}
                activeOpacity={0.9}
                onPress={() => toggle(idx)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[Fonts.bodyBold, styles.question]}>{item.question}</Text>
                  <Text style={[styles.chevron]}>{open ? "▾" : "▸"}</Text>
                </View>
                {open && (
                  <Text style={[Fonts.body, styles.answer]}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { padding: 4 },
  backIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { fontSize: 18, color: "#000" },
  content: { paddingHorizontal: 14, paddingTop: 14, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 12,
  },
  cardOpen: {
    borderColor: "#F4B4B4",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  question: { fontSize: 14, color: "#000" },
  chevron: { fontSize: 16, color: "#444", marginLeft: 10 },
  answer: { fontSize: 12, color: "#555", marginTop: 10 },
});
