import { create } from "zustand";

import { CheckoutStore } from "@/types";

export const useCheckout = create<CheckoutStore>((set) => ({
  items: [],
  total: 0,
  setCheckoutData: (items, total) => set({ items: [...items], total }),
  clearCheckout: () => set({ items: [], total: 0 }),
}));
