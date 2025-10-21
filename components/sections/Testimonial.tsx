import Image from "next/image";
import Link from "next/link";

import { spectral } from "@/config/font";
import { TestimonialSet } from "@/types";

export default function TestimonialSection() {
  const testimonial: TestimonialSet[] = [
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
        src: "/Images/what-customers-say-banner-1.png",
        alt: "Before Testimony 2",
      },
      after: {
        src: "/Images/what-customers-say-banner-2.png",
        alt: "After Testimony 2",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-1.png",
        alt: "Before Testimony 3",
      },
      after: {
        src: "/Images/what-customers-say-banner-2.png",
        alt: "After Testimony 3",
      },
    },
    {
      before: {
        src: "/Images/what-customers-say-banner-1.png",
        alt: "Before Testimony 4",
      },
      after: {
        src: "/Images/what-customers-say-banner-2.png",
        alt: "After Testimony 4",
      },
    },
  ];
  return (
    <section className="flex flex-col px-4 py-16 sm:p-24 gap-8 sm:gap-16 items-center justify-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        THE GLOW IS REAL
      </h2>
      <p>Healthier and even-toned skin that shines with confidence.</p>
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
      <Link
        href="/what-customers-say"
        className="p-4 cursor-pointer border rounded-lg overflow-hidden text-white bg-violet-600 hover:text-violet-600 hover:bg-white hover:border-violet-600"
      >
        See More Result
      </Link>
    </section>
  );
}
