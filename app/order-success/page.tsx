"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/store/Cart";
import { useCheckout } from "@/components/store/Checkout";

export default function OrderSuccessPage() {
  const hasCleared = useRef(false);
  const clearCart = useCart((state) => state.clearCart);
  const clearCheckout = useCheckout((state) => state.clearCheckout);

  useEffect(() => {
    if (!hasCleared.current) {
      clearCart();
      clearCheckout();
      hasCleared.current = true;
    }
  }, [clearCart, clearCheckout]);
  return (
    <section>
      <div>Order success page</div>
    </section>
  );
}
