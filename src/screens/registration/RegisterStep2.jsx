import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../styles/typography";
import { sendStep2 } from "../../services/wholesaleService";
import { useUser } from "../../context/UserContext";
import { fetchCityStateByPincode } from "../../utils/pincode";

export default function RegisterStep2({ navigation, route }) {
  const { phone, step1Data } = route.params;
  const { userId } = useUser();

  const [companyName, setCompanyName] = useState("");
  const [outletName, setOutletName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const handlePincodeChange = async (value) => {
    const cleaned = (value || "").replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);
    if (cleaned.length === 6) {
      setPinLoading(true);
      const data = await fetchCityStateByPincode(cleaned);
      if (data?.city) setCity(data.city);
      if (data?.state) setState(data.state);
      setPinLoading(false);
    }
  };

  const isValidGst = (value) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    return gstRegex.test((value || "").toUpperCase());
  };

  const handleSubmit = async () => {
    if (!userId || !step1Data?.regId) {
      alert("Please start registration again.");
      navigation.reset({ index: 0, routes: [{ name: "ShoppingMode", params: { phone } }] });
      return;
    }

    if (!companyName || !gstNumber || !pincode || !address) {
      alert("Please fill required fields");
      return;
    }

    if (!isValidGst(gstNumber)) {
      alert("Please enter a valid GST number.");
      return;
    }

    try {
      await sendStep2({
        userId,
        regId: step1Data.regId,
        companyName,
        outletName,
        gstNumber,
        pincode,
        address,
        city,
        state,
        landmark,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeTabs" }],
      });
    } catch (err) {
      console.log("Step2 error", err?.response?.data || err?.message);
      alert("Failed to save. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require("../../assets/icons/arrow-left.png")}
              style={styles.backIcon}
            />
          </TouchableOpacity>

          <Text style={[Fonts.heading, styles.header]}>Outlet Details</Text>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressFull}>
          <View style={styles.progressFullFill} />
        </View>

        <Text style={[Fonts.bodyBold, styles.sectionTitle]}>
          Enter Your Outlet Details
        </Text>

        {/* INPUTS */}
        <TextInput
          style={[styles.input, Fonts.body]}
          placeholder="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
        />

        <TextInput
          style={[styles.input, Fonts.body]}
          placeholder="Outlet Name"
          value={outletName}
          onChangeText={setOutletName}
        />

        <TextInput
          style={[styles.input, Fonts.body]}
          placeholder="GST Number"
          value={gstNumber}
          onChangeText={setGstNumber}
        />

        <TextInput
          style={[styles.input, Fonts.body]}
          placeholder="Pin Code"
          value={pincode}
          onChangeText={handlePincodeChange}
          keyboardType="numeric"
          maxLength={6}
        />
        {pinLoading ? <Text style={[Fonts.body, { color: "#888", marginBottom: 6 }]}>Fetching area...</Text> : null}

        <TextInput
          style={[styles.input, Fonts.body]}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half, Fonts.body]}
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />

          <TextInput
            style={[styles.input, styles.half, Fonts.body]}
            placeholder="State"
            value={state}
            onChangeText={setState}
          />
        </View>

        <TextInput
          style={[styles.input, Fonts.body]}
          placeholder="Landmark"
          value={landmark}
          onChangeText={setLandmark}
        />

      </ScrollView>

      {/* SUBMIT BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={[Fonts.bodyExtraBold, styles.submitText]}>Submit</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ===================== STYLES ========================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  backIcon: {
    width: 30,
    height: 30,
  },

  header: {
    fontSize: 26,
    color: "#000",
  },

  /* PROGRESS FULL BAR */
  progressFull: {
    width: "100%",
    height: 8,
    backgroundColor: "#dcdcdc",
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 25,
  },

  progressFullFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#16A100",
  },

  sectionTitle: {
    fontSize: 17,
    marginBottom: 8,
    color: "#000",
  },

  input: {
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    marginBottom: 8,
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  half: {
    width: "48%",
  },

  /* FOOTER BUTTON */
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  submitBtn: {
    backgroundColor: "#FF2E2E",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontSize: 18,
  },
});
