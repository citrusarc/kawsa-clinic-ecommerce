"use client";

import { useEffect } from "react";
import { useCart } from "@/components/store/Cart";
import { useCheckout } from "@/components/store/Checkout";

export default function OrderSuccessPage() {
  const clearCart = useCart((state) => state.clearCart);
  const clearCheckout = useCheckout((state) => state.clearCheckout);

  useEffect(() => {
    clearCart();
    clearCheckout();
  }, []);
  return (
    <section>
      <div>Order success page</div>
    </section>
  );
}
