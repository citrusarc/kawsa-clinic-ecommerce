"use client";

import Image from "next/image";
import { useState } from "react";

import { spectral } from "@/config/font";
import { products } from "@/data/products";

export default function ProductsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsToShow = 4;

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? products.length - itemsToShow : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= products.length - itemsToShow ? 0 : prev + 1
    );
  };
  return (
    <section className="flex flex-col p-4 sm:p-24 gap-8 sm:gap-16 items-center justify-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        SHINE THROUGH EVERY DAY
      </h2>
      <p>Healthy Skin Makes Every First Impression Count</p>

      <div className="relative w-full flex items-center">
        {/* Prev button */}
        <button
          onClick={handlePrev}
          className="absolute left-0 z-10 p-2 bg-white rounded-full shadow hover:bg-violet-600 hover:text-white"
        >
          ◀
        </button>

        {/* Product grid */}
        <div className="overflow-hidden w-full">
          <div
            className="grid grid-cols-1 sm:grid-cols-4 gap-8 transition-transform duration-500"
            style={{
              transform: `translateX(-${(currentIndex * 100) / itemsToShow}%)`, // // added
            }}
          >
            {products.map((product, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src={product.src}
                    alt={product.alt}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3
                  className={`text-lg sm:text-xl font-semibold ${spectral.className}`}
                >
                  {product.name}
                </h3>
                <p className="text-gray-600">
                  {product.currency}
                  {product.price}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="absolute right-0 z-10 p-2 bg-white rounded-full shadow hover:bg-violet-600 hover:text-white"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
