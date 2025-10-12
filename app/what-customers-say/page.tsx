import Image from "next/image";

import { spectral } from "@/config/font";
import { TestimonialSet } from "@/types";

export default function WhatCustomersSayPage() {
  const testimonialSets: TestimonialSet[] = [
    {
      before: {
        src: "/Images/what-customers-say-banner-1.png",
        alt: "Before Testimony 1",
      },
      after: {
        src: "/Images/what-customers-say-banner-2.png",
        alt: "After Testimony 1",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-3.png",
        alt: "Before Testimony 2",
      },
      after: {
        src: "/Images/what-customers-say-banner-4.png",
        alt: "After Testimony 2",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-5.png",
        alt: "Before Testimony 3",
      },
      after: {
        src: "/Images/what-customers-say-banner-6.png",
        alt: "After Testimony 3",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-7.png",
        alt: "Before Testimony 3",
      },
      after: {
        src: "/Images/what-customers-say-banner-8.png",
        alt: "After Testimony 3",
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
        <div className="w-full flex flex-col gap-8 sm:gap-16">
          {testimonialSets.map((set, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row w-full justify-center"
            >
              <div className="relative w-full sm:w-1/2 aspect-square">
                <Image
                  fill
                  src={set.before.src}
                  alt={set.before.alt}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={index === 0}
                />
                <p className="absolute top-2 left-2 px-2 py-1 text-sm sm:text-base rounded text-white bg-violet-600">
                  Before
                </p>
              </div>
              <div className="relative w-full sm:w-1/2 aspect-square">
                <Image
                  fill
                  src={set.after.src}
                  alt={set.after.alt}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={index === 0}
                />
                <p className="absolute top-2 left-2 px-2 py-1 text-sm sm:text-base rounded text-white bg-violet-600">
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
