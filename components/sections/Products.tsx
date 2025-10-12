"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { NavArrowLeft, NavArrowRight } from "iconoir-react/regular";

import { spectral } from "@/config/font";
import { getProducts } from "@/lib/getProducts";
import { ProductsItem } from "@/types";

export default function ProductsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
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

  useEffect(() => {
    const updateItemsToShow = () => {
      setItemsToShow(window.innerWidth < 640 ? 1 : 4);
      setCurrentIndex(0);
    };
    updateItemsToShow();
    window.addEventListener("resize", updateItemsToShow);
    return () => window.removeEventListener("resize", updateItemsToShow);
  }, []);

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
    <section className="flex flex-col px-4 py-16 sm:p-24 gap-8 sm:gap-16 items-center justify-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        SHINE THROUGH EVERY DAY
      </h2>
      <p>Healthy Skin Makes Every First Impression Count</p>

      <div className="relative flex w-full items-center">
        <button
          onClick={handlePrev}
          className="flex sm:hidden absolute left-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600 "
        >
          <NavArrowLeft className="w-6 h-6 " />
        </button>

        <div className="w-full overflow-hidden ">
          <div
            className={`flex transition-transform duration-500 ${
              itemsToShow === 4 ? "justify-between" : ""
            }`}
            style={{
              transform: `translateX(-${(currentIndex * 100) / itemsToShow}%)`,
            }}
          >
            {products.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col flex-shrink-0 items-center text-center`}
                style={{
                  flex:
                    itemsToShow === 1
                      ? "0 0 100%"
                      : `0 0 calc(${100 / itemsToShow}% - ${
                          itemsToShow === 4 ? "2rem" : "0rem"
                        })`,
                }}
              >
                <Link
                  key={item.id}
                  href={`/shop-our-products/${item.id}`}
                  className="flex flex-col gap-4 w-full items-center text-center border border-transparent hover:border-violet-600"
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
                    className={`w-80 text-lg sm:text-xl font-semibold ${spectral.className}`}
                  >
                    {item.name}
                  </h2>
                  <p className="text-neutral-500">
                    {item.currency}
                    {item.variants[0]?.options[0]?.price.toFixed(2) || "N/A"}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={handleNext}
          className="flex sm:hidden absolute right-0 z-10 p-2 rounded-full shadow text-black hover:text-white bg-white hover:bg-violet-600 "
        >
          <NavArrowRight className="w-6 h-6 " />
        </button>
      </div>
    </section>
  );
}
