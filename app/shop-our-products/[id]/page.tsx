// /shop-our-products/[id]/page.tsx
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { spectral } from "@/config/font";
import { ProductsItem } from "@/types";

interface ProductDetailsProps {
  params: { id: string };
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsProps) {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    return <div className="p-8 text-center">Product not found.</div>;
  }

  return (
    <section className="p-4 sm:p-24 flex flex-col gap-8 items-center">
      <div className="relative w-full max-w-md aspect-square">
        <Image
          fill
          src={product.src}
          alt={product.alt}
          className="object-cover rounded-xl"
        />
      </div>

      <h1 className={`text-3xl sm:text-5xl font-bold ${spectral.className}`}>
        {product.name}
      </h1>

      <p className="text-neutral-600 text-lg max-w-2xl">
        {product.description}
      </p>

      <p className="text-violet-600 text-2xl font-semibold">
        {product.currency}
        {product.price}
      </p>

      {product.additionalInfo1 && (
        <div className="mt-6 p-4 border rounded-lg bg-neutral-50 max-w-2xl">
          <h3 className="font-semibold text-lg">Additional Info</h3>
          <p className="text-neutral-700">{product.additionalInfo1}</p>
        </div>
      )}
    </section>
  );
}
