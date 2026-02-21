import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Fonts } from "../../styles/typography";
import { useUser } from "../../../context/UserContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile } from "../../../services/userService";
import IndiaIcon from "../../../assets/icons/india.svg";
import DelhiIcon from "../../../assets/icons/delhi.svg";
import PrivacyIcon from "../../../assets/icons/privacy.svg";
import TermsIcon from "../../../assets/icons/terms.svg";
import ShippingIcon from "../../../assets/icons/shipping.svg";
import PaymentPolicyIcon from "../../../assets/icons/paymentpolicy.svg";
import RefundIcon from "../../../assets/icons/refund.svg";
import SupportIcon from "../../../assets/icons/support.svg";
import MyProfileIcon from "../../../assets/icons/myprofile.svg";
import OrdersIcon from "../../../assets/icons/orders.svg";
import FaqsIcon from "../../../assets/icons/faqs.svg";
import HeartIcon from "../../../assets/icons/heart.svg";
import NotificationsIcon from "../../../assets/icons/notifications.svg";
import RequestIcon from "../../../assets/icons/request.svg";
import AddressBookIcon from "../../../assets/icons/addressbook.svg";

const sections = [
  {
    title: "Others",
    items: [
      { id: "req", label: "Request Product", icon: null },
      { id: "addr", label: "Address Book", icon: null },
      { id: "list", label: "My List", icon: require("../../../assets/icons/wishlist.png") },
      { id: "noti", label: "Notifications", icon: require("../../../assets/icons/notifications.png") },
      { id: "faq", label: "FAQS", icon: require("../../../assets/icons/faqs.png") },
    ],
  },
  {
    title: "Legal",
    items: [
      { id: "privacy", label: "Privacy Policy", icon: null },
      { id: "terms", label: "Terms and Conditions", icon: null },
      { id: "shipping", label: "Shipping & Delivery Policy", icon: null },
      { id: "refund", label: "Refund & Cancellation Policy", icon: null },
      { id: "payment", label: "Payment Policy", icon: null },
    ],
  },
];

export default function ProfileScreen({ navigation }) {
  const { phone, userId, setPhone, setUser } = useUser();
  const [showLogout, setShowLogout] = useState(false);
  const [profileName, setProfileName] = useState("");

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("userPhone")
        .then((savedPhone) => {
          if (savedPhone) setPhone(savedPhone);
        })
        .catch(() => {});
    }, [setPhone])
  );

  useEffect(() => {
    if (!userId) return;
    getProfile(userId)
      .then((res) => {
        const owner = res?.data?.registration?.ownerDetails;
        const name =
          owner?.firstName ||
          res?.data?.user?.name ||
          "";
        setProfileName(name);
      })
      .catch(() => {});
  }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient
          colors={["#FFCACA", "#FFFFFF"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Image
              source={require("../../../assets/icons/arrow-left.png")}
              style={styles.backIcon}
            />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            <Image
              source={require("../../../assets/icons/user.png")}
              style={styles.avatar}
            />
          </View>

          <Text style={[Fonts.bodyBold, styles.name]}>
            {profileName || "Profile"}
          </Text>
          <Text style={[Fonts.body, styles.phone]}>{phone || "N/A"}</Text>
        </LinearGradient>

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate("MyOrders")}>
            <OrdersIcon width={42} height={42} />
            <Text style={[Fonts.bodyBold, styles.quickLabel]}>Your Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate("Support")}>
            <SupportIcon width={40} height={40} />
            <Text style={[Fonts.bodyBold, styles.quickLabel]}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("ProfileDetails")}
          >
            <MyProfileIcon width={42} height={42} />
            <Text style={[Fonts.bodyBold, styles.quickLabel]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* LIST SECTIONS */}
        {sections.map((section) => (
          <View key={section.id || section.title} style={styles.sectionWrap}>
            <Text style={[Fonts.bodyBold, styles.sectionTitle]}>
              {section.title}
            </Text>

            <View style={styles.listCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.id === "addr") {
                      navigation.navigate("AddressBook");
                    } else if (item.id === "list") {
                      navigation.navigate("Wishlist");
                    } else if (item.id === "faq") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("FAQs");
                    } else if (item.id === "req") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("RequestProduct");
                    } else if (item.id === "terms") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("TermsConditions");
                    } else if (item.id === "privacy") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("PrivacyPolicy");
                    } else if (item.id === "shipping") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("ShippingDeliveryPolicy");
                    } else if (item.id === "refund") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("RefundCancellationPolicy");
                    } else if (item.id === "payment") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("PaymentPolicy");
                    } else if (item.id === "noti") {
                      const parentNav = navigation.getParent?.();
                      const rootNav = parentNav?.getParent?.() || parentNav || navigation;
                      rootNav.navigate("Notifications");
                    }
                  }}
                >
                  <View style={styles.listLeft}>
                    {item.id === "privacy" ? (
                      <PrivacyIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "terms" ? (
                      <TermsIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "shipping" ? (
                      <ShippingIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "refund" ? (
                      <RefundIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "payment" ? (
                      <PaymentPolicyIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "faq" ? (
                      <FaqsIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "list" ? (
                      <HeartIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "noti" ? (
                      <NotificationsIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : item.id === "req" ? (
                      <RequestIcon
                        width={28}
                        height={28}
                        style={[styles.termsSvgIcon, styles.requestSvgIcon]}
                      />
                    ) : item.id === "addr" ? (
                      <AddressBookIcon width={22} height={22} style={styles.termsSvgIcon} />
                    ) : (
                      <Image source={item.icon} style={styles.listIcon} />
                    )}
                    <Text style={[Fonts.bodyBold, styles.listLabel]}>
                      {item.label}
                    </Text>
                  </View>

                  <Image
                    source={require("../../../assets/icons/arrow-right.png")}
                    style={styles.chevron}
                  />

                  {idx !== section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogout(true)}>
          <MaterialIcons name="logout" size={20} color="#F24B4B" />
          <Text style={[Fonts.bodyBold, styles.logoutText]}>log Out</Text>
        </TouchableOpacity>

        {/* MADE IN INDIA */}
        <View style={styles.madeWrap}>
          <View style={styles.madeRow}>
            <IndiaIcon width={20} height={20} />
            <Text style={[Fonts.body, styles.madeText]}>Made in India</Text>
          </View>
          <View style={styles.madeRow}>
            <DelhiIcon width={18} height={18} />
            <Text style={[Fonts.body, styles.madeText]}>Crafted in Bengaluru</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* LOGOUT MODAL */}
      <Modal
        transparent
        visible={showLogout}
        animationType="fade"
        onRequestClose={() => setShowLogout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Image
              source={require("../../../assets/images/log.png")}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <Text style={[Fonts.bodyBold, styles.modalTitle]}>
              Are you Sure you want to logout ?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={() => setShowLogout(false)}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnTextOutline]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSolid]}
                onPress={() => {
                  setShowLogout(false);
                  setUser({ phone: "", userId: "" });
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                }}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnTextSolid]}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 16,
    padding: 6,
  },
  backIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatar: { width: 46, height: 46, resizeMode: "contain" },
  name: { fontSize: 18, color: "#000" },
  phone: { fontSize: 13, color: "#8C8C8C", marginTop: 4 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginTop: 12,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    paddingVertical: 16,
    gap: 5,
  },
  quickIcon: { width: 45, height: 45, resizeMode: "contain" },
  quickLabel: { fontSize: 13, color: "#000" },

  sectionWrap: {
    paddingHorizontal: 12,
    marginTop: 20,
  },
  sectionTitle: { fontSize: 18, color: "#444", marginBottom: 10 },

  listCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  listItem: {
    position: "relative",
    paddingVertical: 10,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  termsSvgIcon: { width: 22, height: 22 },
  requestSvgIcon: { marginLeft: -2 },
  listLabel: { fontSize: 14, color: "#000" },
  chevron: { width: 16, height: 16, tintColor: "#aaa", position: "absolute", right: 2, top: 14, resizeMode: "contain" },
  divider: {
    height: 1,
    backgroundColor: "#E9E9E9",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1,
  },

  logoutBtn: {
    marginTop: 24,
    marginHorizontal: 12,
    borderWidth: 1.4,
    borderColor: "#F24B4B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },
  logoutText: { color: "#F24B4B", fontSize: 14 },

  madeWrap: {
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 40,
  },
  madeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flagIcon: { width: 18, height: 18, resizeMode: "contain" },
  madeText: { color: "#B3B3B3", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  modalImage: { width: 74, height: 74 },
  modalTitle: { textAlign: "center", fontSize: 18, color: "#000" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.6,
  },
  modalBtnOutline: {
    borderColor: "#F24B4B",
    backgroundColor: "#fff",
  },
  modalBtnSolid: {
    borderColor: "#F24B4B",
    backgroundColor: "#F24B4B",
  },
  modalBtnTextOutline: { color: "#F24B4B", fontSize: 15 },
  modalBtnTextSolid: { color: "#fff", fontSize: 15 },
});

