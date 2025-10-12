import { supabase } from "@/utils/supabase/client";
import { ProductsItem } from "@/types";

export async function getProducts(): Promise<ProductsItem[]> {
  const { data, error } = await supabase.from("products").select(`
      *,
      product_variants (
        id,
        variantName,
        variant_options (
          id,
          optionName,
          price,
          currency
        )
      )
    `);

  if (error) {
    console.error("Error fetching products:", JSON.stringify(error, null, 2));
    throw new Error(
      `Failed to fetch products: ${error.message || "Unknown error"}`
    );
  }

  const transformedData: ProductsItem[] = data.map((product) => ({
    id: product.id,
    src: product.src,
    alt: product.alt,
    name: product.name,
    description: Array.isArray(product.description)
      ? product.description
      : JSON.parse(product.description || "[]"),
    additionalInfo1: Array.isArray(product.additionalInfo1)
      ? product.additionalInfo1
      : JSON.parse(product.additionalInfo1 || "[]"),
    additionalInfo2: Array.isArray(product.additionalInfo2)
      ? product.additionalInfo2
      : JSON.parse(product.additionalInfo2 || "[]"),
    currency: product.currency,
    status: product.status,
    variants: product.product_variants.map((variant: any) => ({
      id: variant.id,
      variantName: variant.variantName,
      options: variant.variant_options.map((option: any) => ({
        id: option.id,
        optionName: option.optionName,
        price: option.price,
        currency: option.currency,
      })),
    })),
  }));

  return transformedData;
}
