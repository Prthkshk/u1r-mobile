import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { getProfile } from "../../services/userService";
import { useUser } from "../../context/UserContext";
import { deleteAccount } from "../../services/userService";

export default function ProfileDetails({ navigation }) {
  const { userId, phone, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [user, setUserData] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getProfile(userId)
      .then((res) => {
        setUserData(res.data?.user || null);
        setRegistration(res.data?.registration || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const owner = registration?.ownerDetails || {};
  const outlet = registration?.outletDetails || {};

  const handleConfirmDelete = async () => {
    if (!userId) {
      setShowDeleteModal(false);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(userId);
    } catch (err) {
      // show a simple alert but still close the modal
      alert("Failed to delete account. Please try again.");
      setDeleting(false);
      return;
    }

    await setUser({ phone: "", userId: "", mode: "" });

    setDeleting(false);
    setShowDeleteModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={["#FFE7E7", "#ffffff"]}
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
          <Text style={[Fonts.bodyExtraBold, styles.headerTitle]}>Profile details</Text>
          <View style={styles.headerRightSpacer} />
        </LinearGradient>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#FF3B3B" />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Image
                    source={require("../../assets/icons/p.png")}
                    style={styles.cardIcon}
                  />
                </View>
                <Text style={[Fonts.bodyExtraBold, styles.cardTitle]}>
                  Personal Details
                </Text>
              </View>

              <View style={styles.fieldBox}>
                <Text style={[Fonts.body, styles.label]}>Name</Text>
                <Text style={[Fonts.bodyBold, styles.value]}>
                  {owner.firstName || user?.name || "-"}
                </Text>
              </View>

              <View style={styles.fieldBox}>
                <Text style={[Fonts.body, styles.label]}>Mobile Number</Text>
                <Text style={[Fonts.bodyBold, styles.value]}>
                  {owner.phone || user?.phone || phone || "-"}
                </Text>
              </View>

              <View style={styles.fieldBox}>
                <Text style={[Fonts.body, styles.label]}>Email</Text>
                <Text style={[Fonts.bodyBold, styles.value]}>
                  {owner.email || user?.email || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Image
                    source={require("../../assets/icons/business.png")}
                    style={styles.cardIcon}
                  />
                </View>
                <Text style={[Fonts.bodyExtraBold, styles.cardTitle]}>
                  Business Details
                </Text>
              </View>

              <View style={styles.fieldBox}>
                <Text style={[Fonts.body, styles.label]}>Company Name</Text>
                <Text style={[Fonts.bodyBold, styles.value]}>
                  {outlet.companyName || "-"}
                </Text>
              </View>

              <View style={styles.fieldBox}>
                <Text style={[Fonts.body, styles.label]}>GST Number</Text>
                <Text style={[Fonts.bodyBold, styles.value]}>
                  {outlet.gstNumber || "-"}
                </Text>
              </View>

              <View style={styles.fieldBox}>
                <Text style={[Fonts.body, styles.label]}>Outlet Name</Text>
                <Text style={[Fonts.bodyBold, styles.value]}>
                  {outlet.outletName || "-"}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteModal(true)}>
              <Image
                source={require("../../assets/icons/delete.png")}
                style={styles.deleteIcon}
              />
              <Text style={[Fonts.bodyBold, styles.deleteText]}>Delete Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[Fonts.bodyExtraBold, styles.modalTitle]}>Are you Sure ?</Text>
            <Text style={[Fonts.body, styles.modalSubtitle]}>
              You want to delete your account permanently
            </Text>
            <Text style={[Fonts.body, styles.modalSubtitleSmall]}>
              All your data, including account information and preferences will be permanently removed
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnOutlineText]}>
                  {deleting ? "Deleting..." : "Delete Account"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSolid]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={[Fonts.bodyBold, styles.modalBtnSolidText]}>Keep Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f7" },
  scrollContent: { paddingBottom: 40, paddingTop: 4 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 6 },
  backIcon: { width: 24, height: 24, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { fontSize: 18, color: "#2b2b2b" },
  headerRightSpacer: { width: 24, height: 24 },
  loaderBox: { marginTop: 80, alignItems: "center" },
  card: {
    backgroundColor: "#fdfdfd",
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    padding: 14,
    // shadowColor: "#000",
    // shadowOpacity: 0.05,
    // shadowOffset: { width: 0, height: 4 },
    // shadowRadius: 8,
    elevation: 0.1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#FF2E2E",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cardIcon: { width: 34, height: 34, tintColor: "#FF2E2E", resizeMode: "contain" },
  cardTitle: { fontSize: 18, color: "#3a3a3a" },
  fieldBox: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: { fontSize: 12, color: "#b0b0b0", marginBottom: 4 },
  value: { fontSize: 14, color: "#000" },
  deleteBtn: {
    marginHorizontal: 14,
    marginTop: 18,
    borderWidth: 1.4,
    borderColor: "#FF2E2E",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  deleteIcon: { width: 18, height: 18, tintColor: "#FF2E2E", resizeMode: "contain" },
  deleteText: { color: "#FF2E2E", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: { fontSize: 22, color: "#000" },
  modalSubtitle: { textAlign: "center", color: "#555", marginTop: 6 },
  modalSubtitleSmall: { textAlign: "center", color: "#777", marginTop: 2 },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.6,
  },
  modalBtnOutline: {
    borderColor: "#FF3B3B",
    backgroundColor: "#fff",
  },
  modalBtnSolid: {
    borderColor: "#FF3B3B",
    backgroundColor: "#FF3B3B",
  },
  modalBtnOutlineText: { color: "#FF3B3B", fontSize: 15 },
  modalBtnSolidText: { color: "#fff", fontSize: 15 },
});
