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
import { useUser } from "../../context/UserContext";
import { sendStep1 } from "../../services/wholesaleService";

export default function RegisterStep1({ navigation, route }) {
  const { phone } = route.params;
  const { userId } = useUser();

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState([]);

  const toggleType = (type) => {
    if (businessType.includes(type)) {
      setBusinessType(businessType.filter((x) => x !== type));
    } else {
      setBusinessType([...businessType, type]);
    }
  };

  const handleNext = async () => {
    if (!userId) {
      alert("Please login again.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    if (!firstName || !phone || !email) {
      alert("Please fill required fields");
      return;
    }

    try {
      const res = await sendStep1({
        userId,
        phone,
        firstName,
        secondName,
        email,
        businessType,
      });

      const regId = res?.data?.id;
      if (!regId) {
        alert("Could not save. Try again.");
        return;
      }

      const step1Data = {
        regId,
        phone,
        firstName,
        secondName,
        email,
        businessType,
      };

      navigation.navigate("RegisterStep2", { phone, step1Data });
    } catch (err) {
      console.log("Step1 error", err?.response?.data || err?.message);
      alert("Failed to save step 1. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        
        <Text style={styles.header}>Register</Text>

        {/* CYLINDRICAL PROGRESS BAR (50%) */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressFill} />
          <View style={styles.progressRemaining} />
        </View>

        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Register Your Business with U1R</Text>
            <Text style={styles.bannerText}>
              Provide some basic{"\n"}information about your business
            </Text>
          </View>

          <Image
            source={require("../../assets/images/register.png")}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </View>

        {/* Owner Details */}
        <Text style={styles.sectionTitle}>Enter Owner Details</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Second Name"
          value={secondName}
          onChangeText={setSecondName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        {/* Business Type */}
        <Text style={styles.sectionTitle}>Business Type</Text>

        <View style={styles.typeBox}>
          {["Restaurant", "Sweet Shop", "Catering", "Hotel", "Kirana Store", "Others"].map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={styles.checkboxRow}
                onPress={() => toggleType(item)}
              >
                <View
                  style={[
                    styles.checkbox,
                    businessType.includes(item) && styles.checkboxChecked,
                  ]}
                >
                  {businessType.includes(item) && <View style={styles.checkIcon} />}
                </View>
                <Text style={styles.checkboxLabel}>{item}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

      </ScrollView>

      {/* Next button */}
      <View style={styles.bottomWrapper}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { paddingHorizontal: 20, paddingTop: 12 },
  header: { fontSize: 26, fontWeight: "800", marginBottom: 12 },

  /* PROGRESS BAR */
  progressBarWrapper: {
    width: "100%",
    height: 8,
    backgroundColor: "#dcdcdc",
    borderRadius: 50,
    flexDirection: "row",
    marginBottom: 25,
    overflow: "hidden",
  },
  progressFill: {
    width: "50%", // Step 1 = 50%
    backgroundColor: "#16A100",
  },
  progressRemaining: {
    width: "50%",
    backgroundColor: "transparent",
  },

  bannerCard: {
    width: "95%",
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    flexDirection: "row",
    marginBottom: 25,
  },

  bannerTitle: { fontSize: 17, fontWeight: "700" },
  bannerText: { fontSize: 13, color: "#666", marginTop: 5, lineHeight: 18 },
  bannerImage: { width: 130, height: 130 },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },

  input: {
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    marginBottom: 6,
  },

  typeBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#eee",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#bbb",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: { backgroundColor: "#16A100", borderColor: "#16A100" },

  checkIcon: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#fff",
    transform: [{ rotate: "-45deg" }],
    marginTop: -1,
  },

  checkboxLabel: { fontSize: 14 },

  bottomWrapper: { paddingHorizontal: 20, paddingBottom: 30 },

  nextBtn: {
    backgroundColor: "#FF2E2E",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  nextText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
