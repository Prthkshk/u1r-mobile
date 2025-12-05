import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Fonts } from "../styles/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCityStateByPincode } from "../../utils/pincode";
import { useUser } from "../../context/UserContext";

export default function AddAddress({ navigation }) {
  const { userId } = useUser();
  const addressesKey = useMemo(() => `userAddresses_${userId || "guest"}`, [userId]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [pincode, setPincode] = useState("");
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

  const handleSave = async () => {
    if (!name || !phone || !addressLine || !pincode || !city || !state) {
      alert("Please fill required fields");
      return;
    }

    const data = {
      id: `${Date.now()}`,
      name,
      phone,
      altPhone,
      addressLine,
      pincode,
      city,
      state,
      landmark,
    };

    try {
      const raw = await AsyncStorage.getItem(addressesKey);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? [data, ...list] : [data];
      await AsyncStorage.setItem(addressesKey, JSON.stringify(next));
    } catch (err) {
      // Ignore storage errors but still navigate back with the in-memory address
    }

    navigation.navigate("AddressBook", { newAddress: data });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient
          colors={["#FFE6E6", "#FFFFFF"]}
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
          <Text style={[Fonts.bodyBold, styles.headerTitle]}>Add Address</Text>
        </LinearGradient>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Alternative Mobile Number"
            keyboardType="phone-pad"
            value={altPhone}
            onChangeText={setAltPhone}
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={addressLine}
            onChangeText={setAddressLine}
          />
          <TextInput
          style={styles.input}
          placeholder="Pincode"
          keyboardType="number-pad"
          value={pincode}
          onChangeText={handlePincodeChange}
          maxLength={6}
        />
        {pinLoading ? <Text style={[Fonts.body, { color: "#888", marginBottom: 4 }]}>Fetching area...</Text> : null}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="State"
              value={state}
              onChangeText={setState}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Landmark"
            value={landmark}
            onChangeText={setLandmark}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={[Fonts.bodyBold, styles.saveText]}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: { width: 22, height: 22, tintColor: "#000", resizeMode: "contain" },
  headerTitle: { fontSize: 18, color: "#000" },
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  input: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    paddingHorizontal: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#FF2E2E",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 16 },
});
