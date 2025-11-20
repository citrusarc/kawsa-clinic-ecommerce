"use client";
import { create } from "zustand";

import { CartState } from "@/types";

export const useCart = create<CartState>((set) => ({
  items: [],
  cartCount: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);

      if (existing) {
        const updatedItems = state.items.map((i) =>
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
        const updatedCartCount = updatedItems.reduce(
          (acc, i) => acc + i.quantity,
          0
        );

        return {
          items: updatedItems,
          cartCount: updatedCartCount,
        };
      }

      // Add new item with Stepper quantity
      const newItem = {
        ...item,
        totalPrice: (item.currentPrice ?? item.unitPrice) * item.quantity,
      };

      return {
        items: [...state.items, newItem],
        cartCount:
          state.items.reduce((acc, i) => acc + i.quantity, 0) + item.quantity,
      };
    }),

  removeItem: (id) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;

      if (existing.quantity === 1) {
        return {
          items: state.items.filter((i) => i.id !== id),
          cartCount: state.cartCount - 1,
        };
      }

      existing.quantity -= 1;
      return {
        items: [...state.items],
        cartCount: state.cartCount - 1,
      };
    }),

  clearItem: (id) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;

      return {
        items: state.items.filter((i) => i.id !== id),
        cartCount: state.cartCount - existing.quantity,
      };
    }),
}));
