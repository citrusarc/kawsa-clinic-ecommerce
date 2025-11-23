import { create } from "zustand";

interface CheckoutStore {
  items: any[];
  total: number;
  setCheckoutData: (items: any[], total: number) => void;
  clearCheckout: () => void;
}

export const useCheckout = create<CheckoutStore>((set) => ({
  items: [],
  total: 0,
  setCheckoutData: (items, total) => set({ items: [...items], total }),
  clearCheckout: () => set({ items: [], total: 0 }),
}));
