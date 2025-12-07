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

export const useCheckout = create<CheckoutStore>((set) => {
  const initData = typeof window !== "undefined" ? safeCheckout() : null;

  return {
    items: initData?.items || [],
    subTotalPrice: initData?.subTotalPrice || 0,
    shippingFee: 0,
    totalPrice: initData?.totalPrice || 0,

    setCheckoutData: (items) => {
      const subTotalPrice = items.reduce(
        (sum, item) => sum + item.subTotalPrice,
        0
      );
      const shippingFee = 0;
      const totalPrice = subTotalPrice + shippingFee;

      const data = {
        items,
        subTotalPrice,
        shippingFee,
        totalPrice,
      };

      if (typeof window !== "undefined")
        sessionStorage.setItem("checkoutData", JSON.stringify(data));
      set(data);
    },

    clearCheckout: () => {
      if (typeof window !== "undefined")
        sessionStorage.removeItem("checkoutData");
      set({
        items: [],
        subTotalPrice: 0,
        shippingFee: 0,
        totalPrice: 0,
      });
    },
  };
});
