"use client";
import { create } from "zustand";
import { CartState, CartItem } from "@/types";

export const useCart = create<CartState>((set, get) => ({
  items:
    typeof window !== "undefined"
      ? (
          JSON.parse(localStorage.getItem("cartItems") || "[]") as CartItem[]
        ).map((i) => ({ ...i, swiped: false }))
      : [],

  cartCount:
    typeof window !== "undefined"
      ? (
          JSON.parse(localStorage.getItem("cartItems") || "[]") as CartItem[]
        ).reduce((acc, i) => acc + i.quantity, 0)
      : 0,

  _swipeStartX: 0,
  _isSwiping: false,

  addItem: (item: CartItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      const updatedItems: CartItem[] = existing
        ? state.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  totalPrice:
                    (i.currentPrice ?? i.unitPrice) *
                    (i.quantity + item.quantity),
                }
              : i
          )
        : [
            ...state.items,
            {
              ...item,
              totalPrice: (item.currentPrice ?? item.unitPrice) * item.quantity,
              swiped: false,
            },
          ];

      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);

      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));

      return { items: updatedItems, cartCount };
    }),

  removeItem: (id: string) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;

      const updatedItems: CartItem[] =
        existing.quantity > 1
          ? state.items.map((i) =>
              i.id === id
                ? {
                    ...i,
                    quantity: i.quantity - 1,
                    totalPrice:
                      (i.currentPrice ?? i.unitPrice) * (i.quantity - 1),
                  }
                : i
            )
          : state.items.filter((i) => i.id !== id);

      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));

      return { items: updatedItems, cartCount };
    }),

  clearItem: (id: string) =>
    set((state) => {
      const updatedItems = state.items.filter((i) => i.id !== id);
      const cartCount = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      return { items: updatedItems, cartCount };
    }),

  setQuantity: (id: string, quantity: number) =>
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
      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));

      return { items: updatedItems, cartCount };
    }),

  startSwipe: (id: string, startX: number) =>
    set(() => ({
      _swipeStartX: startX,
      _isSwiping: true,
      items: get().items.map((it) => ({ ...it, swiped: false })),
    })),

  moveSwipe: (id: string, currentX: number) =>
    set((state) => {
      if (!get()._isSwiping) return state;

      const diff = (get()._swipeStartX || 0) - currentX;
      const threshold = 20;
      const activateDiff = 60;
      const shouldSwipe = diff > threshold;
      const swipedNow = diff > activateDiff;

      const items = state.items.map((it) =>
        it.id === id ? { ...it, swiped: shouldSwipe ? swipedNow : false } : it
      );

      return { items };
    }),

  endSwipe: (id: string) =>
    set((state) => {
      if (!state._isSwiping) return state;

      const items = state.items.map((it) =>
        it.id === id ? { ...it, swiped: !!it.swiped } : it
      );

      return {
        items,
        _swipeStartX: 0,
        _isSwiping: false,
      };
    }),

  resetSwipe: () =>
    set((state) => ({
      items: state.items.map((it) => ({ ...it, swiped: false })),
      _isSwiping: false,
    })),
}));
