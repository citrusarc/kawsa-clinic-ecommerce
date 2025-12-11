import { create } from "zustand";
import { CheckoutStore } from "@/types";

const getCheckout = () => {
  try {
    const value = sessionStorage.getItem("checkoutData");
    if (!value) return null;
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

export const useCheckout = create<CheckoutStore>((set) => {
  const initData = typeof window !== "undefined" ? getCheckout() : null;

  return {
    items: initData?.items || [],
    subTotalPrice: initData?.subTotalPrice || 0,
    shippingFee: initData?.shippingFee || 0,
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

      if (typeof window !== "undefined") {
        sessionStorage.setItem("checkoutData", JSON.stringify(data));
      }

      set(data);
    },

    clearCheckout: () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("checkoutData");
      }

      set({
        items: [],
        subTotalPrice: 0,
        shippingFee: 0,
        totalPrice: 0,
      });
    },

    setShippingFee: (fee: number) => {
      set((state) => {
        const shippingFee = Number(Number(fee ?? 0).toFixed(2));
        const totalPrice = Number(
          Number((state.subTotalPrice || 0) + shippingFee).toFixed(2)
        );

        const newState = {
          ...state,
          shippingFee,
          totalPrice,
        };

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "checkoutData",
            JSON.stringify({
              items: newState.items,
              subTotalPrice: newState.subTotalPrice,
              shippingFee: newState.shippingFee,
              totalPrice: newState.totalPrice,
            })
          );
        }
        return newState;
      });
    },
  };
});
