import { create } from "zustand";

import { CheckoutStore } from "@/types";

export const useCheckout = create<CheckoutStore>((set) => ({
  items:
    typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem("checkoutData") || "{}").items || []
      : [],
  total:
    typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem("checkoutData") || "{}").total || 0
      : 0,

  setCheckoutData: (items, total) => {
    const data = { items: [...items], total };
    sessionStorage.setItem("checkoutData", JSON.stringify(data));
    set(data);
  },

  clearCheckout: () => {
    sessionStorage.removeItem("checkoutData");
    set({ items: [], total: 0 });
  },
}));
