import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Fonts } from "../styles/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";

export default function AddressBook({ navigation, route }) {
  const { userId } = useUser();
  const addressesKey = useMemo(() => `userAddresses_${userId || "guest"}`, [userId]);
  const selectedKey = useMemo(() => `selectedAddress_${userId || "guest"}`, [userId]);
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const newAddress = route?.params?.newAddress;
    if (newAddress) {
      const mergeAndPersist = async () => {
        const buildId = (addr) => addr.id || `${addr.phone}-${addr.pincode}-${addr.name}`;
        try {
          const raw = await AsyncStorage.getItem(addressesKey);
          const stored = raw ? JSON.parse(raw) : [];
          const base = Array.isArray(stored) ? stored : [];
          const deduped = base.filter((addr) => buildId(addr) !== buildId(newAddress));
          const next = [newAddress, ...deduped];
          setAddresses(next);
          await AsyncStorage.setItem(addressesKey, JSON.stringify(next));
        } catch {
          // fall back to in-memory merge if storage fails
          setAddresses((prev) => {
            const deduped = prev.filter((addr) => buildId(addr) !== buildId(newAddress));
            const next = [newAddress, ...deduped];
            AsyncStorage.setItem(addressesKey, JSON.stringify(next)).catch(() => {});
            return next;
          });
        } finally {
          // clear param so it doesn't append again on focus
          navigation.setParams({ newAddress: null });
        }
      };

      mergeAndPersist();
    }
  }, [route?.params?.newAddress, navigation, addressesKey]);

  useEffect(() => {
    AsyncStorage.getItem(addressesKey)
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setAddresses(parsed);
          }
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(selectedKey)
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed?.id) setSelectedId(parsed.id);
        }
      })
      .catch(() => {});
  }, [addressesKey, selectedKey]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(addressesKey)
        .then((data) => {
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) setAddresses(parsed);
          }
        })
        .catch(() => {});

      AsyncStorage.getItem(selectedKey)
        .then((data) => {
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed?.id) setSelectedId(parsed.id);
          }
        })
        .catch(() => {});
    }, [addressesKey, selectedKey])
  );

  useEffect(() => {
    AsyncStorage.setItem(addressesKey, JSON.stringify(addresses)).catch(() => {});
  }, [addresses, addressesKey]);

  const handleDelete = (index) => {
    setAddresses((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      AsyncStorage.setItem(addressesKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const handleSelect = (addr) => {
    const id = addr.id || `${addr.phone}-${addr.pincode}-${addr.name}`;
    const selected = { ...addr, id };
    setSelectedId(id);
    AsyncStorage.setItem(selectedKey, JSON.stringify(selected)).catch(() => {});
    navigation.navigate("HomeTabs", {
      screen: "Cart",
      params: { selectedAddress: selected },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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
          <Text style={[Fonts.bodyBold, styles.headerTitle]}>Address Book</Text>
        </LinearGradient>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddAddress")}
          >
            <MaterialIcons name="add" size={18} color="#F24B4B" />
            <Text style={[Fonts.bodyBold, styles.addText]}>Add Address</Text>
          </TouchableOpacity>

          {addresses.length === 0 ? (
            <Text style={[Fonts.body, styles.emptyText]}>No Added Address</Text>
          ) : (
            addresses.map((addr, idx) => {
              const id = addr.id || `${addr.phone}-${addr.pincode}-${addr.name}`;
              const isSelected = id === selectedId;
              return (
                <View key={idx} style={styles.cardWrap}>
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleSelect(addr)}
                    activeOpacity={0.85}
                  >
                    <TouchableOpacity
                      onPress={() => handleDelete(idx)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="delete" size={18} color="#F24B4B" />
                    </TouchableOpacity>

                    <MaterialIcons
                      name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
                      size={20}
                      color={isSelected ? "#F24B4B" : "#000"}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[Fonts.bodyBold, styles.cardName]}>{addr.name}</Text>
                      <Text style={[Fonts.body, styles.cardLine]}>
                        {[
                          addr.addressLine,
                          addr.city,
                          addr.state,
                          addr.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                      <Text style={[Fonts.bodyBold, styles.cardPhoneLabel]}>
                        Phone Number :{" "}
                        <Text style={[Fonts.body, styles.cardPhoneValue]}>
                          {addr.phone}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F24B4B",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  addText: { color: "#F24B4B", fontSize: 14 },
  emptyText: {
    textAlign: "center",
    color: "#8C8C8C",
    marginTop: 12,
  },
  cardWrap: {
    marginTop: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    elevation: 0,
    position: "relative",
  },
  cardName: { fontSize: 15, color: "#000" },
  cardLine: { fontSize: 12, color: "#555", marginTop: 4 },
  cardPhoneLabel: { fontSize: 12, color: "#000", marginTop: 6 },
  cardPhoneValue: { fontSize: 12, color: "#777" },
  deleteBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    padding: 10,
    zIndex: 2,
  },
});
