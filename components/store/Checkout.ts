import { create } from "zustand";
import { CheckoutStore } from "@/types";

const safeCheckout = () => {
  try {
    const raw = sessionStorage.getItem("checkoutData");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

export const useCheckout = create<CheckoutStore>((set) => ({
  items: typeof window !== "undefined" ? safeCheckout()?.items || [] : [],

  subTotalPrice:
    typeof window !== "undefined" ? safeCheckout()?.subTotalPrice || 0 : 0,

  shippingFee: 0,

  totalPrice:
    typeof window !== "undefined" ? safeCheckout()?.totalPrice || 0 : 0,

  setCheckoutData: (items, totalPrice) => {
    const subTotalPrice = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const shippingFee = 0;

    const data = {
      items: items,
      subTotalPrice,
      shippingFee,
      totalPrice,
    };

    sessionStorage.setItem("checkoutData", JSON.stringify(data));
    set(data);
  },

  clearCheckout: () => {
    sessionStorage.removeItem("checkoutData");
    set({
      items: [],
      subTotalPrice: 0,
      shippingFee: 0,
      totalPrice: 0,
    });
  },
}));
