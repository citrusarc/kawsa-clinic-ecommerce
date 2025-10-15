import Image from "next/image";
import Link from "next/link";

import { spectral } from "@/config/font";
import { TestimonialItem } from "@/types";

export default function TestimonialSection() {
  const testimonial: TestimonialItem[] = [
    {
      src: "/Images/testimonial-banner-1.jpg",
      alt: "Testimonial 1",
    },
    {
      src: "/Images/testimonial-banner-2.jpg",
      alt: "Testimonial 2",
    },
    {
      src: "/Images/testimonial-banner-3.jpg",
      alt: "Testimonial 3",
    },
    {
      src: "/Images/testimonial-banner-4.jpg",
      alt: "Testimonial 4",
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
      <Link
        href="/what-customers-say"
        className="p-4 cursor-pointer border text-white bg-violet-600 hover:text-violet-600 hover:bg-white hover:border-violet-600"
      >
        See More Result
      </Link>
    </section>
  );
}
