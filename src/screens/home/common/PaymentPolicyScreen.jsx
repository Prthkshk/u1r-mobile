import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";

const sections = [
  {
    title: "1. Introduction",
    body: [
      "This Payment Policy governs all payment-related terms for orders placed through the U1R mobile application and website (\"Platform\").",
      "This policy applies to both B2C (Retail) and B2B (Wholesale) customers, with specific provisions for each category.",
    ],
  },
  {
    title: "2. General Payment Terms (Applicable to All Orders)",
    bullets: [
      "All payments must be made in Indian Rupees (INR).",
      "Orders are considered confirmed only after successful payment authorization or order confirmation (as applicable).",
      "U1R FOOD PRODUCTS INDIA LLP does not store debit/credit card details.",
      "U1R reserves the right to cancel orders in case of suspected fraud or payment failure.",
    ],
  },
  {
    title: "3. B2C (Retail) Payment Terms",
    body: [
      "For customers registered under B2C mode:",
      "U1R currently accepts Prepaid Orders Only.",
      "Payments must be made at checkout through secure online payment methods.",
      "Payments are processed securely via Razorpay.",
      "Accepted payment methods may include:",
    ],
    bullets: ["UPI", "Debit Cards", "Credit Cards", "Net Banking", "Wallets (as supported by Razorpay)"],
    footerTitle: "Important Notes:",
    footerBullets: [
      "Cash on Delivery (COD) is currently not available.",
      "Orders will not be processed until payment is successfully completed.",
      "In case of payment failure, the order will not be confirmed.",
    ],
  },
  {
    title: "4. B2B (Wholesale) Payment Terms",
    body: [
      "For customers registered under B2B mode:",
      "After an order is successfully placed, the U1R team will contact the registered business representative to confirm:",
    ],
    bullets: ["Order details", "Pricing (if applicable)", "Delivery schedule", "Payment terms"],
    subTitle: "Payment methods for B2B orders may include:",
    subBullets: [
      "Bank transfer (NEFT / RTGS / IMPS)",
      "UPI",
      "Other agreed business payment methods",
    ],
    footerBullets: [
      "Orders will be processed only after:",
      "Payment confirmation, or",
      "Formal confirmation from U1R (if credit terms are applicable)",
      "U1R reserves the right to determine eligibility for credit or deferred payment terms on a case-by-case basis.",
    ],
  },
  {
    title: "5. Failed Transactions",
    body: [
      "In case of:",
      "Failed payment",
      "Amount debited but order not confirmed",
      "Customers should contact their bank first. If the issue persists, they may contact U1R support.",
      "Refunds for failed transactions (if applicable) are typically processed within 5–10 business days, depending on banking timelines.",
    ],
  },
  {
    title: "6. Fraud Prevention",
    body: ["U1R FOOD PRODUCTS INDIA LLP reserves the right to:"],
    bullets: [
      "Verify transactions before processing",
      "Cancel suspicious orders",
      "Request additional documentation for high-value B2B transactions",
    ],
  },
  {
    title: "7. Invoices & GST (B2B & B2C)",
    body: [
      "Tax invoices will be generated as per applicable GST laws.",
      "B2B customers must provide valid GST details for tax credit claims.",
      "U1R shall not be responsible for incorrect GST details submitted by the customer.",
    ],
  },
  {
    title: "8. Policy Updates",
    body: [
      "U1R reserves the right to update this Payment Policy at any time. Continued use of the Platform constitutes acceptance of the revised policy.",
    ],
  },
  {
    title: "9. Contact Information",
    body: ["U1R FOOD PRODUCTS INDIA LLP", "Email: team@u1rfoods.com"],
  },
];

export default function PaymentPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.bodyBold, styles.headerTitle]}>Payment Policy</Text>
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
  groupTitle: { color: "#111", fontSize: 14, marginTop: 8, marginBottom: 4 },
  paragraph: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  bullet: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
