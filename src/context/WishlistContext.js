import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WishlistContext = createContext();
const STORAGE_KEY = "wishlistItems";

const getId = (product) => product?._id || product?.id;

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load wishlist on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      })
      .catch(() => {});
  }, []);

  // Persist whenever items change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const isInWishlist = (id) => items.some((item) => item.id === id);

  const toggleWishlist = (product) => {
    const id = getId(product);
    if (!id) return;

    setItems((prev) => {
      const exists = prev.find((p) => p.id === id);
      if (exists) {
        return prev.filter((p) => p.id !== id);
      }

      const payload = {
        ...product,
        id,
      };
      return [payload, ...prev];
    });
  };

  const removeFromWishlist = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const value = {
    items,
    toggleWishlist,
    isInWishlist,
    removeFromWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
