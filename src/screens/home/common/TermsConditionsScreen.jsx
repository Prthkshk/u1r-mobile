import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";

const sections = [
  {
    title: "1. Introduction",
    body: [
      "Welcome to U1R FOOD PRODUCTS INDIA LLP (\"Company\", \"U1R\", \"we\", \"us\", \"our\").",
      "These Terms & Conditions govern your access to and use of the U1R mobile application, website, and related services (collectively referred to as the \"Platform\").",
      "By accessing or using our Platform, you agree to be bound by these Terms.",
      "If you do not agree, please do not use the Platform.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old to use this Platform.",
      "If registering as a B2B customer, you must be legally authorized to represent the business.",
      "You agree to provide accurate and complete information during registration.",
    ],
  },
  {
    title: "3. Account Registration",
    body: [
      "Users must register using valid contact details.",
      "You are responsible for maintaining confidentiality of your account credentials.",
      "U1R reserves the right to suspend or terminate accounts found to be fraudulent or misused.",
    ],
  },
  {
    title: "4. Products & Services",
    body: [
      "U1R offers food products including but not limited to dry fruits, spices, pulses, edible oils, dates, and related goods.",
      "Product images are for representation purposes only.",
      "Minor variations in weight, color, or packaging may occur.",
      "Availability of products is subject to stock.",
    ],
  },
  {
    title: "5. Pricing & Payment",
    body: [
      "Prices displayed are subject to change without prior notice.",
      "Applicable GST will be charged as per Indian law.",
      "Payments are processed securely through Razorpay or other authorized payment gateways.",
      "U1R does not store card details.",
      "Orders are confirmed only after successful payment authorization.",
    ],
  },
  {
    title: "6. Shipping & Delivery",
    body: [
      "Delivery timelines are estimates and may vary based on location.",
      "U1R is not liable for delays caused by logistics partners or unforeseen circumstances.",
      "Risk of loss passes to the customer upon delivery.",
    ],
  },
  {
    title: "7. Refunds & Cancellations",
    body: [
      "Orders may be cancelled before dispatch.",
      "Refund eligibility is governed by our Refund & Cancellation Policy.",
      "Refunds, if approved, will be processed to the original payment method within a reasonable timeframe.",
    ],
  },
  {
    title: "8. User Conduct",
    body: [
      "You agree not to:",
    ],
    bullets: [
      "Provide false information",
      "Use the Platform for unlawful purposes",
      "Attempt to hack, disrupt, or damage the Platform",
      "Resell products without authorization (unless registered as B2B)",
    ],
  },
  {
    title: "9. Intellectual Property",
    body: [
      "All content on the Platform including logos, trademarks, text, images, and designs are the property of U1R FOOD PRODUCTS INDIA LLP.",
      "Unauthorized use is strictly prohibited.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    body: [
      "U1R shall not be liable for:",
    ],
    bullets: [
      "Indirect or consequential damages",
      "Allergic reactions or misuse of products",
      "Delays beyond our control",
      "Loss of business or profits",
    ],
    footer:
      "Maximum liability shall not exceed the amount paid for the product.",
  },
  {
    title: "11. Food Safety Disclaimer",
    body: [
      "Customers are advised to check ingredient information before consumption.",
      "Products should be stored in a cool and dry place.",
      "U1R shall not be responsible for improper storage after delivery.",
    ],
  },
  {
    title: "12. Termination",
    body: [
      "U1R reserves the right to suspend or terminate access to the Platform at its sole discretion for violation of these Terms.",
    ],
  },
  {
    title: "13. Governing Law & Jurisdiction",
    body: [
      "These Terms shall be governed by the laws of India.",
      "Any disputes shall be subject to the jurisdiction of courts located in India.",
    ],
  },
  {
    title: "14. Amendments",
    body: [
      "U1R reserves the right to modify these Terms at any time. Updated versions will be posted on the Platform with the revised effective date.",
      "Continued use of the Platform constitutes acceptance of revised Terms.",
    ],
  },
  {
    title: "15. Contact Information",
    body: ["U1R FOOD PRODUCTS INDIA LLP", "Email: team@u1rfoods.com"],
  },
];

export default function TermsConditionsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.bodyBold, styles.headerTitle]}>Terms & Conditions</Text>
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
            {section.footer ? (
              <Text style={[Fonts.body, styles.paragraph]}>{section.footer}</Text>
            ) : null}
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
  paragraph: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  bullet: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
