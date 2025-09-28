import Image from "next/image";
import Link from "next/link";

import { spectral } from "@/config/font";

const images1 = [
  {
    src: "/Images/dummy-image.png",
    alt: "Ingredients Banner 1",
    title: "HYALURONIC ACID",
    description: "Deeply Hydrate Your Skin",
  },
  {
    src: "/Images/dummy-image.png",
    alt: "Ingredients Banner 2",
    title: "ALPHA ARBUTIN",
    description: "Fade Skin Pigmentation",
  },
  {
    src: "/Images/dummy-image.png",
    alt: "Ingredients Banner 3",
    title: "KOJIC ACID",
    description: "Safely Lighten Skin",
  },
];

const images2 = [
  {
    src: "/Images/dummy-image.png",
    alt: "Ingredients Banner 4",
    title: "ALOE VERA EXTRACT",
    description: "Sooth And Moisturise Skin",
  },
  {
    src: "/Images/dummy-image.png",
    alt: "IngredientsBanner 5",
    title: "CUCUMBER EXTRACT",
    description: "Calm Skin From Redness",
  },
];

export default function IngredientsSection() {
  return (
    <section className="flex flex-col px-4 sm:px-24">
      <div className="-mx-4 sm:-mx-24 w-screen">
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full h-[640px]">
          {images1.map((item, index) => (
            <div
              key={index}
              className="relative w-full h-full overflow-hidden group"
            >
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/15" />
              <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center text-center text-white">
                <h1 className={`text-2xl sm:text-4xl ${spectral.className}`}>
                  {item.title}
                </h1>
                <p>{item.description}</p>
                <Link href="/">
                  <button className="mt-6 p-4 cursor-pointer text-violet-600 bg-white hover:text-white hover:bg-violet-600">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="-mx-4 sm:-mx-24 w-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 w-full h-[426px] sm:h-[640px]">
          {images2.map((item, index) => (
            <div
              key={index}
              className="relative w-full h-full overflow-hidden group"
            >
              <Image
                fill
                src={item.src}
                alt={item.alt}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/15" />
              <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center text-center text-white">
                <h1 className={`text-2xl sm:text-4xl ${spectral.className}`}>
                  {item.title}
                </h1>
                <p>{item.description}</p>
                <Link href="/">
                  <button className="mt-6 p-4 cursor-pointer text-violet-600 bg-white hover:text-white hover:bg-violet-600">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
