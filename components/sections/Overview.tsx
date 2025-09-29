import Image from "next/image";

import { spectral } from "@/config/font";

const images = [
  {
    src: "/Images/dummy-image.png",
    alt: "Overview Banner 1",
    title: "CLEANSER",
  },
  { src: "/Images/dummy-image.png", alt: "Overview Banner 2", title: "SERUM" },
  {
    src: "/Images/dummy-image.png",
    alt: "Overview Banner 3",
    title: "MOISTURISER",
  },
];

export default function OverviewSection() {
  return (
    <section className="flex flex-col px-4 sm:px-24">
      <div className="-mx-4 sm:-mx-24 w-screen">
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full">
          {images.map((item, index) => (
            <div
              key={index}
              className="relative w-full h-[480px] sm:h-[640px] overflow-hidden group"
            >
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/15" />
              <h1
                className={`absolute inset-0 flex items-center justify-center text-2xl sm:text-4xl ${spectral.className} text-center text-white`}
              >
                {item.title}
              </h1>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
