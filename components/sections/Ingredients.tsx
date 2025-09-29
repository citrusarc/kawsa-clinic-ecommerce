import Image from "next/image";
import Link from "next/link";

import { spectral } from "@/config/font";
import { ingredients } from "@/data/ingredients";

export default function IngredientsSection() {
  return (
    <section className="flex flex-col px-4 sm:px-24">
      <div className="-mx-4 sm:-mx-24 w-screen">
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full h-[640px]">
          {ingredients
            .filter((item) => item.position === "top")
            .map((item) => (
              <div
                key={item.id}
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
                  <Link
                    href={`/ingredients/${item.id}`}
                    className="mt-6 p-4 cursor-pointer text-violet-600 bg-white hover:text-white hover:bg-violet-600"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="-mx-4 sm:-mx-24 w-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 w-full h-[426px] sm:h-[640px]">
          {ingredients
            .filter((item) => item.position === "bottom")
            .map((item) => (
              <div
                key={item.id}
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
                  <Link
                    href={`/ingredients/${item.id}`}
                    className="mt-6 p-4 cursor-pointer text-violet-600 bg-white hover:text-white hover:bg-violet-600"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
