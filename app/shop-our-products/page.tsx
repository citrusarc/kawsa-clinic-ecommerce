"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { spectral } from "@/config/font";
import { getProducts } from "@/lib/getProducts";
import { ProductsItem } from "@/types";

export default function ShopOurProductsPage() {
  const [products, setProducts] = useState<ProductsItem[]>([]);

  useEffect(() => {
    getProducts().then((data) =>
      setProducts(
        data.filter(
          (item) => !item.status?.isHidden && !item.status?.isDisabled
        )
      )
    );
  }, []);

  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 items-center justify-center text-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        SHOP OUR PRODUCTS
      </h2>
      <p>Shop the routine that works.</p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 w-full">
        {products.map((item) => (
          <Link
            key={item.id}
            href={`/shop-our-products/${item.id}`}
            className="flex flex-col gap-4 items-center text-center rounded-4xl overflow-hidden border border-transparent hover:border-violet-600"
          >
            <div className="relative w-full aspect-square rounded-4xl overflow-hidden">
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover"
              />
            </div>
            <h2
              className={`w-80 text-lg sm:text-xl font-semibold ${spectral.className}`}
            >
              {item.name}
            </h2>
            <p className="text-neutral-500">
              {item.currency}
              {item.variants[0]?.options[0]?.price.toFixed(2) || "N/A"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
