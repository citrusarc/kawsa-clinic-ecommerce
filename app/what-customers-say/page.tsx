import Image from "next/image";

import { spectral } from "@/config/font";
import { TestimonialSet } from "@/types";

export default function WhatCustomersSayPage() {
  const testimonial: TestimonialSet[] = [
    {
      before: {
        src: "/Images/what-customers-say-banner-1.jpg",
        alt: "Before Testimony 1",
      },
      after: {
        src: "/Images/what-customers-say-banner-2.jpg",
        alt: "After Testimony 1",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-3.jpg",
        alt: "Before Testimony 2",
      },
      after: {
        src: "/Images/what-customers-say-banner-4.jpg",
        alt: "After Testimony 2",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-5.jpg",
        alt: "Before Testimony 3",
      },
      after: {
        src: "/Images/what-customers-say-banner-6.jpg",
        alt: "After Testimony 3",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-7.jpg",
        alt: "Before Testimony 4",
      },
      after: {
        src: "/Images/what-customers-say-banner-8.jpg",
        alt: "After Testimony 4",
      },
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
              className="flex flex-col sm:flex-row w-full justify-center rounded-2xl sm:rounded-4xl overflow-hidden"
            >
              <div className="relative w-full sm:w-1/2 h-[360px] sm:h-[640px]">
                <Image
                  fill
                  src={item.before.src}
                  alt={item.before.alt}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={index === 0}
                />
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 text-lg sm:text-xl rounded-xl sm:rounded-2xl text-white bg-violet-200/60">
                  Before
                </p>
              </div>

              <div className="relative w-full sm:w-1/2 h-[360px] sm:h-[640px]">
                <Image
                  fill
                  src={item.after.src}
                  alt={item.after.alt}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={index === 0}
                />
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 text-lg sm:text-xl rounded-xl sm:rounded-2xl text-white bg-violet-200/60">
                  After
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
