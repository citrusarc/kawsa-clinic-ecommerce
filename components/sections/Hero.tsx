"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { spectral } from "@/config/font";

export default function HeroSection() {
  const slides = [
    {
      src: "/Images/dummy-image.png",
      alt: "Hero Banner 1",
      title: "KAWSA GENTLE EXFOLIATING GEL CLEANSER",
      descriptions: "Lift away dead skin and unclog pores",
    },
    {
      src: "/Images/dummy-image.png",
      alt: "Hero Banner 2",
      title: "KAWSA HYDRATING SERUM",
      descriptions: "Deep hydration for glowing skin",
    },
    {
      src: "/Images/dummy-image.png",
      alt: "Hero Banner 3",
      title: "KAWSA DAILY SUNSCREEN",
      descriptions: "Protect your skin from harmful UV rays",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="-mt-28 sm:-mt-40">
      <div className="relative w-full h-[640px] sm:h-[960px] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="relative w-full h-[640px] sm:h-[960px] flex-shrink-0"
            >
              <Image
                fill
                src={slide.src}
                alt={slide.alt}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 flex flex-col gap-8 p-4 sm:py-6 sm:px-24 items-start justify-center">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute transition-opacity duration-500 ${
                index === current ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex flex-col gap-2 text-white">
                <h1 className={`text-2xl sm:text-4xl ${spectral.className}`}>
                  {slide.title}
                </h1>
                <p className="text-xl sm:text-2xl">{slide.descriptions}</p>
              </div>
              <Link href="/shop-our-products">
                <button className="mt-6 p-4 cursor-pointer text-violet-600 bg-white hover:text-white hover:bg-violet-600">
                  SHOP NOW
                </button>
              </Link>
            </div>
          ))}
        </div>
        <div className="absolute flex gap-4 w-full justify-center bottom-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-3 h-3 rounded-full ${
                index === current ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
