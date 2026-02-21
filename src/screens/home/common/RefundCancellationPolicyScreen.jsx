import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";

const sections = [
  {
    title: "1. Introduction",
    body: [
      "This Refund & Cancellation Policy governs the cancellation of orders and refund eligibility for purchases made through the U1R mobile application and website (\"Platform\").",
      "This policy applies to both B2C (Retail) and B2B (Wholesale) customers, with specific provisions for each category.",
    ],
  },
  {
    title: "2. Order Cancellation",
    groups: [
      {
        title: "A. Before Dispatch (All Customers)",
        bullets: [
          "Orders may be cancelled before dispatch.",
          "Cancellation requests must be made through the app or by contacting customer support.",
          "If payment has been made, a full refund will be processed to the original payment method.",
        ],
      },
      {
        title: "B. After Dispatch",
        body: ["Orders cannot be cancelled once dispatched.", "Refund eligibility will be determined as per the conditions below."],
      },
    ],
  },
  {
    title: "3. B2C (Retail) Refund Policy",
    body: [
      "Due to the perishable and consumable nature of food products:",
      "Refunds or replacements will be provided only if:",
    ],
    bullets: [
      "The product is damaged during delivery",
      "The wrong product was delivered",
      "The product is defective or unfit for consumption",
    ],
    subTitle: "Conditions:",
    subBullets: [
      "Complaint must be raised within 48 hours of delivery",
      "Photo or video proof may be required",
      "Product must be unused and in original packaging",
    ],
    footerTitle: "Refunds will NOT be issued for:",
    footerBullets: [
      "Change of mind",
      "Taste preference",
      "Minor packaging variations",
      "Improper storage after delivery",
    ],
  },
  {
    title: "4. B2B (Wholesale) Refund Policy",
    body: ["For B2B customers:", "Refunds or replacements are allowed only for:"],
    bullets: ["Damaged goods", "Incorrect items supplied", "Verified quality defects"],
    subBullets: [
      "Claims must be raised within 24–48 hours of delivery",
      "Bulk orders may require physical inspection or return of goods before approval",
    ],
    footerTitle: "No refunds will be issued for:",
    footerBullets: [
      "Market price fluctuations",
      "Unsold stock",
      "Improper storage or handling by the buyer",
    ],
  },
  {
    title: "5. Refund Process",
    bullets: [
      "Approved refunds will be processed to the original payment method.",
      "Refund timelines may vary depending on banks or payment providers.",
      "Typically, refunds are processed within 5–10 business days.",
      "Payments made through secure gateways such as Razorpay will be refunded via the same channel.",
    ],
  },
  {
    title: "6. Non-Returnable Items",
    body: ["The following items are non-returnable:"],
    bullets: [
      "Opened food products",
      "Products without original packaging",
      "Products reported after the complaint window",
      "Customized or special bulk orders",
    ],
  },
  {
    title: "7. Right to Reject Refund Requests",
    body: ["U1R FOOD PRODUCTS INDIA LLP reserves the right to:"],
    bullets: [
      "Reject refund claims if misuse is suspected",
      "Investigate repeated refund requests",
      "Take necessary action in cases of fraudulent claims",
    ],
  },
  {
    title: "8. Dispute Resolution",
    body: [
      "Any disputes related to refunds shall be governed by the Terms & Conditions of U1R and applicable laws of India.",
    ],
  },
  {
    title: "9. Policy Updates",
    body: [
      "U1R reserves the right to update this Refund & Cancellation Policy at any time. Continued use of the Platform constitutes acceptance of the revised policy.",
    ],
  },
  {
    title: "10. Contact Information",
    body: ["U1R FOOD PRODUCTS INDIA LLP", "Email: team@u1rfoods.com"],
  },
];

export default function RefundCancellationPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.bodyBold, styles.headerTitle]}>Refund & Cancellation Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[Fonts.bodyBold, styles.company]}>U1R FOOD PRODUCTS INDIA LLP</Text>
        <Text style={[Fonts.body, styles.effective]}>Effective Date: 14 February 2026</Text>

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
            {(section.groups || []).map((group) => (
              <View key={group.title} style={styles.groupWrap}>
                <Text style={[Fonts.bodyBold, styles.groupTitle]}>{group.title}</Text>
                {(group.body || []).map((line) => (
                  <Text key={line} style={[Fonts.body, styles.paragraph]}>
                    {line}
                  </Text>
                ))}
                {(group.bullets || []).map((bullet) => (
                  <Text key={bullet} style={[Fonts.body, styles.bullet]}>
                    {"\u2022"} {bullet}
                  </Text>
                ))}
              </View>
            ))}
            {section.subTitle ? (
              <Text style={[Fonts.bodyBold, styles.groupTitle]}>{section.subTitle}</Text>
            ) : null}
            {(section.subBullets || []).map((bullet) => (
              <Text key={bullet} style={[Fonts.body, styles.bullet]}>
                {"\u2022"} {bullet}
              </Text>
            ))}
            {section.footerTitle ? (
              <Text style={[Fonts.bodyBold, styles.groupTitle]}>{section.footerTitle}</Text>
            ) : null}
            {(section.footerBullets || []).map((bullet) => (
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
  effective: { marginTop: 4, color: "#656565", fontSize: 13 },
  section: { marginTop: 18 },
  sectionTitle: { color: "#111", fontSize: 16, marginBottom: 8 },
  groupWrap: { marginTop: 8 },
  groupTitle: { color: "#111", fontSize: 14, marginTop: 8, marginBottom: 4 },
  paragraph: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  bullet: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
