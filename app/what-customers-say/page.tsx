import Image from "next/image";

import { spectral } from "@/config/font";
import { TestimonialItem } from "@/types";

export default function WhatCustomersSayPage() {
  const testimonial: TestimonialItem[] = [
    {
      src: "/Images/what-customers-say-banner-1.jpg",
      alt: "Testimony 1",
    },
    {
      src: "/Images/what-customers-say-banner-2.jpg",
      alt: "Testimony 2",
    },
    {
      src: "/Images/what-customers-say-banner-3.jpg",
      alt: "Testimony 3",
    },
    {
      src: "/Images/what-customers-say-banner-4.jpg",
      alt: "Testimony 4",
    },
  ];
  return (
    <section className="-mt-28 sm:-mt-40">
      <div className="relative w-screen h-[640px] sm:h-[960px]">
        <Image
          fill
          src="/Images/what-customers-say-hero-banner.png"
          alt="What Customers Say Hero Banner"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/15" />
        <div
          className={`absolute inset-0 flex flex-col gap-2 items-center justify-center text-center text-white`}
        >
          <h1 className={`text-2xl sm:text-4xl ${spectral.className}`}>
            WHAT CUSTOMERS SAY
          </h1>
          <p className="text-xl sm:text-2xl">
            Trusted by many, loved for results.
          </p>
        </div>
      </div>
      <div className="flex flex-col px-4 py-16 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
        <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
          TESTIMONIAL RESULTS
        </h2>
        <div className="flex flex-col gap-8 sm:gap-16 w-full items-center">
          {testimonial.map((item, index) => (
            <div
              key={index}
              className="relative w-full sm:h-[960px] aspect-square"
            >
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
