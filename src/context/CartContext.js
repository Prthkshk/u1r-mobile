import React, { createContext, useContext, useMemo, useState } from "react";
import { useUser } from "./UserContext";

export const CartContext = createContext();

const getId = (product) => product?._id || product?.id;
const getMinQty = (product) => Math.max(Number(product?.moq) || 0, 1);
const normalizeMode = (value = "") => {
  const upper = String(value).toUpperCase();
  if (upper === "B2B" || upper === "WHOLESALE") return "wholesale";
  if (upper === "B2C" || upper === "RETAIL") return "retail";
  return "";
};
const inferModeFromProduct = (product) => {
  if (product?.isRetail === true) return "retail";
  if (product?.isWholesale === true) return "wholesale";
  return "";
};

export function CartProvider({ children }) {
  const { mode: userMode } = useUser();
  const activeMode = normalizeMode(userMode) || "wholesale";
  const [cartsByMode, setCartsByMode] = useState({
    retail: [],
    wholesale: [],
  });

  const resolveModeKey = (override, product) =>
    normalizeMode(override || product?.mode || inferModeFromProduct(product)) ||
    activeMode ||
    "wholesale";

  const updateModeCart = (modeKey, updater) => {
    setCartsByMode((prev) => {
      const next = { ...prev };
      const current = Array.isArray(prev[modeKey]) ? prev[modeKey] : [];
      next[modeKey] = updater(current);
      return next;
    });
  };

  const addToCart = (product, modeOverride) => {
    const id = getId(product);
    if (!id) return;
    const modeKey = resolveModeKey(modeOverride, product);

    const productMinQty = getMinQty(product);
    const amount = Math.max(Number(product.qty) || 0, productMinQty);

    updateModeCart(modeKey, (prev) => {
      const existing = prev.find((item) => item.id === id);

      if (existing) {
        return prev.map((item) =>
          item.id === id
            ? {
                ...item,
                moq: product?.moq ?? item.moq ?? productMinQty,
                qty: Math.max(
                  getMinQty({ ...item, moq: product?.moq ?? item.moq }),
                  item.qty + amount
                ),
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          id,
          moq: product?.moq ?? productMinQty,
          qty: amount,
          mode: product?.mode ?? modeKey,
        },
      ];
    });
  };

  const incrementItem = (id, modeOverride) => {
    const modeKey = resolveModeKey(modeOverride);
    updateModeCart(modeKey, (prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decrementItem = (id, modeOverride) => {
    const modeKey = resolveModeKey(modeOverride);
    updateModeCart(modeKey, (prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return item;

        const minQty = getMinQty(item);
        const currentQty = Number(item.qty) || 0;
        const nextQty = currentQty - 1;

        // remove item if user decrements at or below MOQ
        if (currentQty <= minQty) return [];

        const clampedQty = Math.max(minQty, nextQty);
        return { ...item, qty: clampedQty };
      })
    );
  };

  const removeFromCart = (id, modeOverride) => {
    const modeKey = resolveModeKey(modeOverride);
    updateModeCart(modeKey, (prev) => prev.filter((item) => item.id !== id));
  };

  const setItemQuantity = (id, quantity, modeOverride) => {
    const modeKey = resolveModeKey(modeOverride);
    const qty = Math.max(0, Number(quantity) || 0);
    updateModeCart(modeKey, (prev) => {
      if (qty === 0) return prev.filter((item) => item.id !== id);
      const exists = prev.find((item) => item.id === id);
      if (!exists) return prev;
      const minQty = getMinQty(exists);
      const finalQty = Math.max(minQty, qty);
      return prev.map((item) =>
        item.id === id ? { ...item, qty: finalQty } : item
      );
    });
  };

  const clearCart = (modeOverride) => {
    const modeKey = resolveModeKey(modeOverride);
    updateModeCart(modeKey, () => []);
  };

  const cartItems = cartsByMode[activeMode] || [];
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * item.qty,
        0
      ),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      addToCart,
      incrementItem,
      decrementItem,
      removeFromCart,
      setItemQuantity,
      clearCart,
      totalAmount,
    }),
    [cartItems, cartCount, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
