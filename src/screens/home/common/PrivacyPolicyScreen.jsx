import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../styles/typography";

const sections = [
  {
    title: "1. Introduction",
    body: [
      'U1R FOOD PRODUCTS INDIA LLP ("Company", "U1R", "we", "us", or "our") is committed to protecting your privacy and safeguarding your personal data.',
      "This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you access or use:",
      "The U1R mobile application",
      "Our website (u1rfoods.com)",
      'Any related services (collectively, the "Platform")',
      "By using the Platform, you agree to the practices described in this Privacy Policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: ["We collect only the information necessary to provide our services."],
    groups: [
      {
        title: "A. Personal Information (All Users)",
        bullets: [
          "Full Name",
          "Mobile Number (for OTP authentication)",
          "Email Address",
          "Shipping and Billing Address",
          "PIN Code",
          "Order History",
        ],
      },
      {
        title: "B. B2B-Specific Information (Wholesale Users Only)",
        body: ["To provide wholesale pricing and comply with legal and tax regulations, we collect:"],
        bullets: [
          "Business / Outlet Name",
          "GST Number",
          "Business Address",
          "Authorized Contact Details",
          "Outlet Location Information",
        ],
        footer:
          "This information is required to verify business customers and comply with applicable tax laws.",
      },
      {
        title: "C. Payment Information",
        body: [
          "All payments are processed securely through third-party payment gateways such as Razorpay.",
          "We do NOT store:",
        ],
        bullets: ["Debit card details", "Credit card details", "UPI PINs", "Bank account credentials"],
        footer:
          "Payment processing is handled by certified payment service providers in compliance with applicable financial regulations.",
      },
      {
        title: "D. Technical & Usage Information",
        body: ["We may automatically collect:"],
        bullets: [
          "Device type and operating system",
          "IP address",
          "App usage statistics",
          "Log data",
          "Cookies (if using our website)",
        ],
      },
    ],
    footer: "This information helps us improve performance, security, and user experience.",
  },
  {
    title: "3. How We Use Your Information",
    body: ["We use your information to:"],
    bullets: [
      "Process and deliver orders",
      "Provide customer support",
      "Verify B2B accounts",
      "Send order confirmations and updates",
      "Improve our services and app performance",
      "Prevent fraud and misuse",
      "Comply with legal and tax obligations",
    ],
    footer: "We do NOT sell your personal data to any third party.",
  },
  {
    title: "4. Data Sharing",
    body: ["We may share information only when necessary with:"],
    bullets: [
      "Payment partners (such as Razorpay)",
      "Logistics and delivery partners",
      "Government authorities when legally required",
      "Technology service providers assisting in app operations",
    ],
    footer: "All third parties are contractually required to protect your information.",
  },
  {
    title: "5. Data Retention",
    body: [
      "We retain personal data only for as long as necessary:",
      "To fulfill orders",
      "To comply with legal, taxation, and regulatory requirements",
      "To resolve disputes",
      "To prevent fraud",
      "After the required period, data may be securely deleted or anonymized.",
    ],
  },
  {
    title: "6. Data Security",
    body: [
      "We implement reasonable technical and organizational safeguards, including:",
      "Encrypted data transmission (HTTPS/SSL)",
      "Secure servers",
      "Restricted internal access controls",
      "OTP-based authentication",
      "However, no electronic transmission method is 100% secure.",
    ],
  },
  {
    title: "7. Your Rights",
    body: [
      "Under applicable Indian laws, including the Digital Personal Data Protection Act, 2023, you may:",
      "Request access to your personal data",
      "Request correction of inaccurate data",
      "Request deletion of your account",
      "Withdraw consent (where applicable)",
      "To exercise these rights, contact us at the email provided below.",
    ],
  },
  {
    title: "8. Account Deletion",
    body: [
      "You may request deletion of your account by:",
      "Using the in-app account deletion option (if available), or",
      "Sending an email to: team@u1rfoods.com",
      "Upon verification, your account and associated personal data will be deleted, except where retention is required by law.",
    ],
  },
  {
    title: "9. Children's Privacy",
    body: [
      "Our Platform is intended for individuals aged 18 years or older.",
      "We do not knowingly collect personal data from minors. If we become aware of such collection, we will take steps to delete the information.",
    ],
  },
  {
    title: "10. Changes to This Privacy Policy",
    body: [
      "We may update this Privacy Policy from time to time.",
      "Updated versions will be posted within the app and/or website with a revised effective date.",
      "Continued use of the Platform after updates constitutes acceptance of the revised policy.",
    ],
  },
  {
    title: "11. Contact Information",
    body: ["U1R FOOD PRODUCTS INDIA LLP", "Email: team@u1rfoods.com", "Website: www.u1rfoods.com"],
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image
            source={require("../../../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={[Fonts.bodyBold, styles.headerTitle]}>Privacy Policy</Text>
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
                {group.footer ? (
                  <Text style={[Fonts.body, styles.paragraph]}>{group.footer}</Text>
                ) : null}
              </View>
            ))}
            {section.footer ? <Text style={[Fonts.body, styles.paragraph]}>{section.footer}</Text> : null}
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
  groupWrap: { marginTop: 10 },
  groupTitle: { color: "#111", fontSize: 14, marginBottom: 4 },
  paragraph: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  bullet: { color: "#3A3A3A", fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
