import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";

const sections = [
  {
    title: "1. Introduction",
    body: [
      "This Shipping & Delivery Policy outlines the terms governing the dispatch and delivery of products ordered through the U1R mobile application and website (\"Platform\").",
      "This policy applies to all orders placed with U1R FOOD PRODUCTS INDIA LLP and varies based on whether the customer is registered under B2B (Wholesale) or B2C (Retail) mode.",
    ],
  },
  {
    title: "2. General Shipping Terms (Applicable to All Orders)",
    bullets: [
      "Orders are processed only after successful payment confirmation.",
      "Delivery timelines are estimates and may vary due to location, weather conditions, logistics issues, public holidays, or unforeseen circumstances.",
      "U1R is not liable for delays caused by third-party logistics providers.",
      "Customers are responsible for providing accurate shipping details.",
      "If delivery fails due to incorrect address or unavailable recipient, re-delivery charges may apply.",
      "Risk of loss or damage passes to the customer upon delivery confirmation.",
    ],
  },
  {
    title: "3. B2C (Retail) Shipping Terms",
    body: ["For customers registered under B2C mode:"],
    bullets: [
      "Orders are typically delivered within 1–2 working days from the date of dispatch.",
      "Delivery timelines may vary depending on serviceable locations.",
      "Orders placed after business hours may be processed the next working day.",
      "Delivery attempts will be made by the logistics partner as per standard courier practices.",
      "Same-day delivery is not guaranteed unless specifically mentioned in promotional offers.",
    ],
  },
  {
    title: "4. B2B (Wholesale) Shipping Terms",
    body: ["For customers registered under B2B mode:"],
    bullets: [
      "U1R may offer same-day or next-day delivery, subject to order confirmation time and stock availability.",
      "Bulk orders may require additional handling time.",
      "Delivery schedules may be coordinated directly with the registered business contact.",
      "Minimum order quantities or value thresholds may apply for priority delivery.",
      "U1R reserves the right to schedule deliveries based on operational feasibility.",
    ],
  },
  {
    title: "5. Dispatch & Order Processing",
    bullets: [
      "Orders are processed during standard business hours.",
      "Dispatch confirmation will be communicated via SMS, email, or app notification.",
      "Estimated delivery timelines begin after dispatch confirmation.",
    ],
  },
  {
    title: "6. Shipping Charges",
    bullets: [
      "Shipping charges, if applicable, will be displayed at checkout.",
      "Promotional free shipping offers may apply from time to time.",
      "Additional charges may apply for remote or non-serviceable areas.",
    ],
  },
  {
    title: "7. Damaged or Missing Items",
    body: [
      "Customers must report damaged, defective, or missing products within 48 hours of delivery.",
      "Proof such as photographs may be required.",
      "Resolution will be handled as per the Refund & Cancellation Policy.",
    ],
  },
  {
    title: "8. Force Majeure",
    body: [
      "U1R shall not be liable for delays or failure to deliver due to events beyond reasonable control, including but not limited to:",
    ],
    bullets: [
      "Natural disasters",
      "Government restrictions",
      "Strikes or transportation disruptions",
      "Public health emergencies",
    ],
  },
  {
    title: "9. Changes to This Policy",
    body: [
      "U1R reserves the right to modify this Shipping & Delivery Policy at any time. Updates will be published on the Platform with the revised effective date.",
      "Continued use of the Platform constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "10. Contact Information",
    body: ["U1R FOOD PRODUCTS INDIA LLP", "Email: team@u1rfoods.com"],
  },
];

export default function ShippingDeliveryPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.bodyBold, styles.headerTitle]}>Shipping & Delivery Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[Fonts.bodyBold, styles.company]}>U1R FOOD PRODUCTS INDIA LLP</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[Fonts.bodyBold, styles.sectionTitle]}>{section.title}</Text>
            {(section.body || []).map((line) => (
              <Text key={line} style={[Fonts.body, styles.paragraph]}>
                {line}
              </Text>
            ))}
            {(section.bullets || []).map((bullet) => (
              <Text key={bullet} style={[Fonts.body, styles.bullet]}>
                {"\u2022"} {bullet}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E2E2",
  },
  backIcon: { width: 20, height: 20, tintColor: "#111", resizeMode: "contain" },
  headerTitle: { fontSize: 17, color: "#111" },
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 36 },
  company: { fontSize: 18, color: "#111" },
  section: { marginTop: 18 },
  sectionTitle: { color: "#111", fontSize: 16, marginBottom: 8 },
  paragraph: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  bullet: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
