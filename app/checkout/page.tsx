"use client";

import Image from "next/image";

import { useCheckout } from "@/components/store/Checkout";

export default function CheckoutPage() {
  const { items, total } = useCheckout();
  return (
    <section className="flex flex-col gap-8 p-4 sm:p-24 items-center justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16">
        <div className="order-2 sm:order-1">
          {/* // // SHOW READ-ONLY CART ITEMS */}
          <h2 className="text-xl font-semibold mb-4">Your Order</h2>

          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden">
                  <Image
                    fill
                    src={item.image}
                    alt={item.name}
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-neutral-500">Qty: {item.quantity}</p>
                  <p className="text-violet-600 font-semibold">
                    RM {item.totalPrice}
                  </p>
                </div>
              </div>
            ))}

            <p className="text-xl font-bold mt-2">
              Total: RM{total.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="order-1 sm:order-2">Form</div>
      </div>
    </section>
  );
}
