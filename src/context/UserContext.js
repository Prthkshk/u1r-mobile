import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("userPhone")
      .then((savedPhone) => {
        if (savedPhone) setPhone(savedPhone);
      })
      .catch(() => {});

    AsyncStorage.getItem("userId")
      .then((savedId) => {
        if (savedId) setUserId(savedId);
      })
      .catch(() => {});

    AsyncStorage.getItem("userMode")
      .then((savedMode) => {
        if (savedMode) setMode(savedMode);
      })
      .catch(() => {});
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
    setMode(value);
    try {
      if (value) {
        await AsyncStorage.setItem("userMode", value);
      } else {
        await AsyncStorage.removeItem("userMode");
      }
    } catch {
      // ignore
    }
  };

  const setUserPersist = async ({ phone: nextPhone = "", userId: nextId = "", mode: nextMode = "" }) => {
    await Promise.all([
      setPhonePersist(nextPhone),
      setUserIdPersist(nextId),
      setModePersist(nextMode),
    ]);
  };

  const value = useMemo(
    () => ({
      phone,
      userId,
      mode,
      setPhone: setPhonePersist,
      setUserId: setUserIdPersist,
      setMode: setModePersist,
      setUser: setUserPersist,
    }),
    [phone, userId, mode]
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
