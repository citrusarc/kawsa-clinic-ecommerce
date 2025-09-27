import Image from "next/image";

import { spectral } from "@/config/font";

const images = [
  {
    src: "/Images/dummy-image.png",
    alt: "Testimony 1",
  },
  { src: "/Images/dummy-image.png", alt: "Testimony 2" },
  {
    src: "/Images/dummy-image.png",
    alt: "Testimony 3",
  },
];

export default function WhatCustomersSayPage() {
  return (
    <section className="-mt-28 sm:-mt-40">
      <div className="relative w-screen h-[640px] sm:h-[960px]">
        <Image
          fill
          src="/Images/what-customers-say-hero-banner.png"
          alt="Nujum Cafe Hero Banner"
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
      <div className="flex flex-col px-4 py-8 sm:p-24 gap-8 sm:gap-16 font-medium text-black">
        <h2 className={`text-4xl sm:text-6xl ${spectral.className}`}>
          TESTIMONIAL RESULTS
        </h2>
        {images.map((item, index) => (
          <div key={index} className="w-full h-[200px] sm:h-[640px]">
            <Image
              src={item.src}
              alt={item.alt}
              width={800}
              height={400}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
