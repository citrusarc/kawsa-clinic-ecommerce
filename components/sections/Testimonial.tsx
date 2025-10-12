import Image from "next/image";
import Link from "next/link";

import { spectral } from "@/config/font";
import { TestimonialSet } from "@/types";

export default function TestimonialSection() {
  const testimonialSets: TestimonialSet[] = [
    {
      before: {
        src: "/Images/testimonial-banner-1.png",
        alt: "Before Testimonial 1",
      },
      after: {
        src: "/Images/testimonial-banner-2.png",
        alt: "After Testimonial 1",
      },
    },
    {
      before: {
        src: "/Images/testimonial-banner-3.png",
        alt: "Before Testimonial 2",
      },
      after: {
        src: "/Images/testimonial-banner-4.png",
        alt: "After Testimonial 2",
      },
    },
    {
      before: {
        src: "/Images/testimonial-banner-5.png",
        alt: "Before Testimonial 3",
      },
      after: {
        src: "/Images/testimonial-banner-6.png",
        alt: "After Testimonial 3",
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
      <Link
        href="/what-customers-say"
        className="p-4 cursor-pointer border text-white bg-violet-600 hover:text-violet-600 hover:bg-white hover:border-violet-600"
      >
        See More Result
      </Link>
    </section>
  );
}
