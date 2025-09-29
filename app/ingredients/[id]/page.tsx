import Image from "next/image";
import { spectral } from "@/config/font";
import { ingredients } from "@/data/ingredients";

interface IngredientsDetailsPageProps {
  params: {
    id: string;
  };
}

export default function IngredientsDetailsPage({
  params,
}: IngredientsDetailsPageProps) {
  const ingredient = ingredients.find((item) => item.id === params.id);

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
    <section className="flex flex-col items-center justify-center p-4 sm:p-16 gap-8">
      <div className="relative w-full max-w-2xl aspect-square">
        <Image
          fill
          src={ingredient.src}
          alt={ingredient.alt}
          className="object-cover rounded-2xl"
        />
      </div>
      <h1
        className={`text-4xl sm:text-6xl ${spectral.className} text-violet-600`}
      >
        {ingredient.title}
      </h1>
      <p className="text-lg text-neutral-700 max-w-xl text-center">
        {ingredient.description}
      </p>

      {/* Extra space for future details */}
      <div className="mt-8 max-w-2xl text-center text-neutral-500">
        <p>
          Here you can add more detailed information about{" "}
          <b>{ingredient.title}</b> — such as benefits, usage, and science
          behind the ingredient.
        </p>
      </div>
    </section>
  );
}
