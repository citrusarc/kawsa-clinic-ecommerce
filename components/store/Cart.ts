"use client";
import { create } from "zustand";
import { CartState, CartItem } from "@/types";

export const useCart = create<CartState>((set) => ({
  // // load items from localStorage if in browser
  items:
    typeof window !== "undefined"
      ? (JSON.parse(localStorage.getItem("cartItems") || "[]") as CartItem[])
      : [],

  // // load cartCount from localStorage
  cartCount:
    typeof window !== "undefined"
      ? (
          JSON.parse(localStorage.getItem("cartItems") || "[]") as CartItem[]
        ).reduce(
          (acc: number, i: CartItem) => acc + i.quantity, // // properly typed
          0
        )
      : 0,

  addItem: (item: CartItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      let updatedItems: CartItem[];

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

      // // save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      }

      return { items: updatedItems, cartCount }; // //
    }),

  removeItem: (id: string) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;

      let updatedItems: CartItem[];
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

      // // save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      }

      return { items: updatedItems, cartCount }; // //
    }),

  clearItem: (id: string) =>
    set((state) => {
      const updatedItems = state.items.filter((i) => i.id !== id);
      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);

      // // save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      }

      return { items: updatedItems, cartCount }; // //
    }),

  updateQuantity: (id: string, quantity: number) =>
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

      // // save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      }

      return { items: updatedItems, cartCount }; // //
    }),
}));
