import Image from "next/image";

import { spectral } from "@/config/font";
import { products } from "@/data/products";

export default function ShopOurProductsPage() {
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 items-center justify-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        SHOP OUR PRODUCTS
      </h2>
      <p>Shop the routine that works.</p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 w-full">
        {products.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 items-center text-center"
          >
            <div className="relative w-full aspect-square">
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover"
              />
            </div>
            <h2
              className={`text-lg sm:text-xl font-semibold ${spectral.className}`}
            >
              {item.name}
            </h2>
            <p className="text-neutral-500">
              {item.currency}
              {item.price}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
