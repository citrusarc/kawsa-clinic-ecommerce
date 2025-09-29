import Image from "next/image";
import Link from "next/link";

import { spectral } from "@/config/font";

export default function TestimonialSection() {
  return (
    <section className="flex flex-col px-4 py-16 sm:p-24 gap-8 sm:gap-16 items-center justify-center">
      <h2
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        THE GLOW IS REAL
      </h2>
      <p>Healthier and even-toned skin that shines with confidence.</p>
      <div className="w-full h-72 sm:h-150 overflow-hidden">
        <Image
          src="/Images/testimonial-banner.jpg"
          alt="Testimonial Banner"
          width={1600}
          height={1600}
          className="object-cover w-full h-full"
        />
      </div>
      <Link href="/what-customers-say">
        <button className="mt-6 p-4 cursor-pointer border text-white bg-violet-600 hover:text-violet-600 hover:border-violet-600 hover:bg-white">
          See More Result
        </button>
      </Link>
    </section>
  );
}
