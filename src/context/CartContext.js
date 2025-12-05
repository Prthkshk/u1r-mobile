import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext();

const getId = (product) => product?._id || product?.id;
const getMinQty = (product) => Math.max(Number(product?.moq) || 0, 1);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    const id = getId(product);
    if (!id) return;

    const productMinQty = getMinQty(product);
    const amount = Math.max(Number(product.qty) || 0, productMinQty);

    setCartItems((prev) => {
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

      return [...prev, { ...product, id, moq: product?.moq ?? productMinQty, qty: amount }];
    });
  };

  const incrementItem = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decrementItem = (id) => {
    setCartItems((prev) =>
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

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const setItemQuantity = (id, quantity) => {
    const qty = Math.max(0, Number(quantity) || 0);
    setCartItems((prev) => {
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

  const clearCart = () => {
    setCartItems([]);
  };

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
      addToCart,
      incrementItem,
      decrementItem,
      removeFromCart,
      setItemQuantity,
      clearCart,
      totalAmount,
    }),
    [cartItems, totalAmount]
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
