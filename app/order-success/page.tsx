"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/store/Cart";
import { useCheckout } from "@/components/store/Checkout";

import { spectral } from "@/config/font";

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
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 text-black">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        Order Placed Successfully!
      </h2>
      <p>
        We’ve received your order #123456ABC and it’s getting ready for
        delivery.
      </p>

      {/* Add list order items like checkout one */}
      {/* something like this */}
      {/* {items.length === 0 ? (
        <div className="space-y-4 sm:space-y-8">
          <h2 className="text-xl font-semibold text-violet-600">
            Nothing to checkout
          </h2>
          <p className="text-neutral-400">
            Looks like you haven’t added any items to your cart.
          </p>
          <Link
            href="/shop-our-products"
            className="block p-4 w-fit rounded-lg overflow-hidden cursor-pointer border border-violet-600 text-violet-600 bg-white hover:text-white hover:bg-violet-600"
          >
            Explore Our Products
          </Link>
        </div>
      ) : (
          <div className="space-y-4 sm:space-y-8">
            <h2 className="text-xl font-semibold text-violet-600">
              Order Summary
            </h2>
            <div className="flex flex-col gap-4 sm:gap-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="relative shrink-0 w-32 h-32 rounded-xl sm:rounded-2xl overflow-hidden">
                    <Image
                      fill
                      src={item.src}
                      alt={item.name}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="line-clamp-2 wrap-break-words font-semibold">
                      {item.name}
                    </p>
                    <p className="text-neutral-400">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-violet-600 font-semibold">
                      RM{(item.currentPrice ?? item.unitPrice) * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
              <div>
                <p className="text-neutral-400">
                  Sub Total: RM{subTotalPrice.toFixed(2)}
                </p>
                <p className="text-neutral-400">
                  Shipping Fee:{" "}
                  {isCalculating
                    ? "Estimating your shipping…"
                    : `RM${shippingFee.toFixed(2)}`}
                </p>
                <p className="mt-4 sm:mt-8 text-xl font-semibold">
                  Total: RM{totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div> */}
    </section>
  );
}
