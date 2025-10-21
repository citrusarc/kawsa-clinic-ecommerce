import Image from "next/image";
import { spectral } from "@/config/font";
import { ingredients } from "@/data/ingredients";

interface IngredientsDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function IngredientsDetailsPage({
  params,
}: IngredientsDetailsPageProps) {
  const { id } = await params;
  const ingredient = ingredients.find((item) => item.id === id);

  if (!ingredient) {
    return (
      <section className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          Ingredient not found
        </h1>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8 p-4 sm:p-24 items-center justify-center">
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
        <div className="relative w-full max-w-2xl aspect-square rounded-4xl overflow-hidden">
          <Image
            fill
            src={ingredient.src}
            alt={ingredient.alt}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-8 sm:gap-16 w-full sm:w-1/2 text-md sm:text-lg">
          <h2
            className={`text-4xl sm:text-6xl ${spectral.className} text-black`}
          >
            {ingredient.title}
          </h2>
          {ingredient.additionalInfo1?.map((paragraph, index) => (
            <p key={index} className="text-neutral-500">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
