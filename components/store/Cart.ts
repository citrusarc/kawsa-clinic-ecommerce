"use client";
import { create } from "zustand";
import { CartState, CartItem } from "@/types";

export const useCart = create<CartState>((set, get) => ({
  items:
    typeof window !== "undefined"
      ? (
          JSON.parse(localStorage.getItem("cartItems") || "[]") as CartItem[]
        ).map((index) => ({ ...index, swiped: false }))
      : [],

  cartCount:
    typeof window !== "undefined"
      ? (
          JSON.parse(localStorage.getItem("cartItems") || "[]") as CartItem[]
        ).reduce((acc, index) => acc + index.quantity, 0)
      : 0,

  _swipeStartX: 0,
  _isSwiping: false,

  addItem: (item: CartItem) =>
    set((state) => {
      const existing = state.items.find((index) => index.id === item.id);
      const updatedItems: CartItem[] = existing
        ? state.items.map((index) =>
            index.id === item.id
              ? {
                  ...index,
                  quantity: index.quantity + item.quantity,
                  totalPrice:
                    (index.currentPrice ?? index.unitPrice) *
                    (index.quantity + item.quantity),
                }
              : index
          )
        : [
            ...state.items,
            {
              ...item,
              totalPrice: (item.currentPrice ?? item.unitPrice) * item.quantity,
              swiped: false,
            },
          ];

      const cartCount = updatedItems.reduce(
        (acc, index) => acc + index.quantity,
        0
      );

      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));

      return { items: updatedItems, cartCount };
    }),

  removeItem: (id: string) =>
    set((state) => {
      const existing = state.items.find((index) => index.id === id);
      if (!existing) return state;

      const updatedItems: CartItem[] =
        existing.quantity > 1
          ? state.items.map((index) =>
              index.id === id
                ? {
                    ...index,
                    quantity: index.quantity - 1,
                    totalPrice:
                      (index.currentPrice ?? index.unitPrice) *
                      (index.quantity - 1),
                  }
                : index
            )
          : state.items.filter((index) => index.id !== id);

      const cartCount = updatedItems.reduce(
        (acc, index) => acc + index.quantity,
        0
      );
      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));

      return { items: updatedItems, cartCount };
    }),

  clearItem: (id: string) =>
    set((state) => {
      const updatedItems = state.items.filter((index) => index.id !== id);
      const cartCount = updatedItems.reduce(
        (acc, index) => acc + index.quantity,
        0
      );
      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      return { items: updatedItems, cartCount };
    }),

  setQuantity: (id: string, quantity: number) =>
    set((state) => {
      const updatedItems = state.items.map((index) =>
        index.id === id
          ? {
              ...index,
              quantity,
              totalPrice: quantity * (index.currentPrice ?? index.unitPrice),
            }
          : index
      );

      const cartCount = updatedItems.reduce(
        (acc, index) => acc + index.quantity,
        0
      );
      if (typeof window !== "undefined")
        localStorage.setItem("cartItems", JSON.stringify(updatedItems));

      return { items: updatedItems, cartCount };
    }),

  startSwipe: (id: string, startX: number) =>
    set(() => ({
      _swipeStartX: startX,
      _isSwiping: true,
      items: get().items.map((index) => ({ ...index, swiped: false })),
    })),

  moveSwipe: (id: string, currentX: number) =>
    set((state) => {
      if (!get()._isSwiping) return state;

      const diff = (get()._swipeStartX || 0) - currentX;
      const threshold = 20;
      const activateDiff = 60;
      const shouldSwipe = diff > threshold;
      const swipedNow = diff > activateDiff;

      const items = state.items.map((index) =>
        index.id === id
          ? { ...index, swiped: shouldSwipe ? swipedNow : false }
          : index
      );

      return { items };
    }),

  endSwipe: (id: string) =>
    set((state) => {
      if (!state._isSwiping) return state;

      const items = state.items.map((index) =>
        index.id === id ? { ...index, swiped: !!index.swiped } : index
      );

      return {
        items,
        _swipeStartX: 0,
        _isSwiping: false,
      };
    }),

  resetSwipe: () =>
    set((state) => ({
      items: state.items.map((index) => ({ ...index, swiped: false })),
      _isSwiping: false,
    })),
}));
