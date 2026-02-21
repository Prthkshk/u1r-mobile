import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

const normalizeMode = (value = "") => {
  const upper = value.toUpperCase();
  if (upper === "B2B" || upper === "WHOLESALE") return "wholesale";
  if (upper === "B2C" || upper === "RETAIL") return "retail";
  return "";
};

export function UserProvider({ children }) {
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [savedPhone, savedId, savedMode] = await Promise.all([
          AsyncStorage.getItem("userPhone"),
          AsyncStorage.getItem("userId"),
          AsyncStorage.getItem("userMode"),
        ]);
        console.log("[UserContext] AsyncStorage userMode:", savedMode);
        if (savedPhone) setPhone(savedPhone);
        if (savedId) setUserId(savedId);
        if (savedMode) {
          const nextMode = normalizeMode(savedMode);
          setMode(nextMode);
          console.log("[UserContext] mode set from storage:", nextMode);
        } else {
          setMode("retail");
          console.log("[UserContext] mode defaulted to retail");
        }
      } catch {
        // ignore hydration errors for now
      } finally {
        setIsHydrated(true);
      }
    };

    hydrate();
  }, []);

  const setPhonePersist = async (value) => {
    setPhone(value);
    try {
      if (value) {
        await AsyncStorage.setItem("userPhone", value);
      } else {
        await AsyncStorage.removeItem("userPhone");
      }
    } catch {
      // ignore persistence errors for now
    }
  };

  const setUserIdPersist = async (value) => {
    setUserId(value);
    try {
      if (value) {
        await AsyncStorage.setItem("userId", value);
      } else {
        await AsyncStorage.removeItem("userId");
      }
    } catch {
      // ignore persistence errors for now
    }
  };

  const setModePersist = async (value) => {
    const normalized = normalizeMode(value);
    setMode(normalized);
    console.log("[UserContext] mode set in context:", normalized);
    try {
      if (normalized) {
        await AsyncStorage.setItem("userMode", normalized);
      } else {
        await AsyncStorage.removeItem("userMode");
      }
    } catch {
      // ignore
    }
  };

  const setUserPersist = async ({ phone: nextPhone, userId: nextId, mode: nextMode }) => {
    await Promise.all([
      nextPhone !== undefined ? setPhonePersist(nextPhone) : Promise.resolve(),
      nextId !== undefined ? setUserIdPersist(nextId) : Promise.resolve(),
      nextMode !== undefined ? setModePersist(nextMode) : Promise.resolve(),
    ]);
  };
  const selectMode = async (nextMode) => {
    await setModePersist(nextMode);
  };

  const value = useMemo(
    () => ({
      phone,
      userId,
      mode,
      isHydrated,
      setPhone: setPhonePersist,
      setUserId: setUserIdPersist,
      setMode: setModePersist,
      selectMode,
      setUser: setUserPersist,
    }),
    [phone, userId, mode, isHydrated]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
