import { supabase } from "@/utils/supabase/client";
import { ProductsItem, ProductVariant, VariantOption } from "@/types";

interface SupabaseProduct {
  id: string;
  src: string;
  alt: string;
  name: string;
  description: string | string[];
  additionalInfo1: string | string[];
  additionalInfo2: string | string[];
  currency: string;
  status: { isHidden: boolean; isDisabled: boolean; isComingSoon: boolean };
  product_variants: {
    id: string;
    variantName: string;
    variant_options: {
      id: string;
      optionName: string;
      currency: string;
      unitPrice: number;
      originalPrice?: number;
      currentPrice?: number;
    }[];
  }[];
}

export async function getProducts(): Promise<ProductsItem[]> {
  const { data, error } = await supabase.from("products").select(`
      *,
      product_variants (
        id,
        variantName,
        variant_options (
          id,
          optionName,
          currency,
          unitPrice,
          originalPrice,
          currentPrice
        )
      )
    `);

  if (error) {
    console.error("Error fetching products:", JSON.stringify(error, null, 2));
    throw new Error(
      `Failed to fetch products: ${error.message || "Unknown error"}`
    );
  }

  if (!data) {
    console.warn("No data returned from products query");
    return [];
  }

  const transformedData: ProductsItem[] = data.map(
    (product: SupabaseProduct) => ({
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
      variants: product.product_variants.map(
        (variant): ProductVariant => ({
          id: variant.id,
          variantName: variant.variantName,
          options: variant.variant_options.map(
            (option): VariantOption => ({
              id: option.id,
              optionName: option.optionName,
              currency: option.currency,
              unitPrice: option.unitPrice,
              originalPrice: option.originalPrice,
              currentPrice: option.currentPrice,
            })
          ),
        })
      ),
    })
  );

  return transformedData;
}
