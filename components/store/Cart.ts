"use client";
import { create } from "zustand";
import { CartState } from "@/types";

export const useCart = create<CartState>((set) => ({
  items:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("cartItems") || "[]")
      : [], // // load from localStorage
  cartCount:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("cartItems") || "[]").reduce(
          (acc: any, i: any) => acc + i.quantity,
          0
        )
      : 0, // // load count from localStorage

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      let updatedItems;

      if (existing) {
        updatedItems = state.items.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                totalPrice:
                  (i.currentPrice ?? i.unitPrice) *
                  (i.quantity + item.quantity),
              }
            : i
        );
      } else {
        updatedItems = [
          ...state.items,
          {
            ...item,
            totalPrice: (item.currentPrice ?? item.unitPrice) * item.quantity,
          },
        ];
      }

      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems)); // // save to localStorage
      return { items: updatedItems, cartCount }; // //
    }),

  removeItem: (id) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;

      let updatedItems;
      if (existing.quantity > 1) {
        updatedItems = state.items.map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: i.quantity - 1,
                totalPrice: (i.currentPrice ?? i.unitPrice) * (i.quantity - 1),
              }
            : i
        );
      } else {
        updatedItems = state.items.filter((i) => i.id !== id);
      }

      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems)); // //
      return { items: updatedItems, cartCount }; // //
    }),

  clearItem: (id) =>
    set((state) => {
      const updatedItems = state.items.filter((i) => i.id !== id);
      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems)); // //
      return { items: updatedItems, cartCount }; // //
    }),

  updateQuantity: (id, quantity) =>
    set((state) => {
      const updatedItems = state.items.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity,
              totalPrice: quantity * (i.currentPrice ?? i.unitPrice),
            }
          : i
      );

      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems)); // //
      return { items: updatedItems, cartCount }; // //
    }),
}));
