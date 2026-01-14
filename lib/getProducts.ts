import { sql } from "@/utils/neon/client";
import { ProductsItem, ProductVariant, VariantOption } from "@/types";

// // Define types for database response
interface DbVariantOption {
  id: string;
  optionName: string;
  weight: number;
  width: number;
  length: number;
  height: number;
  currency: string;
  unitPrice: number;
  originalPrice: number;
  currentPrice: number;
}

interface DbProductVariant {
  id: string;
  variantName: string;
  variant_options: DbVariantOption[];
}

interface DbProduct {
  id: string;
  src: string;
  alt: string;
  name: string;
  description: string | string[];
  additionalinfo1: string | string[];
  additionalinfo2: string | string[];
  currency: string;
  status: {
    isPromo?: boolean;
    isHidden?: boolean;
    isDisabled?: boolean;
    isBestSeller?: boolean;
    isComingSoon?: boolean;
  };
  product_variants: DbProductVariant[];
}

export async function getProducts(): Promise<ProductsItem[]> {
  try {
    // // Using raw SQL query instead of Supabase query builder
    const data = await sql`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pv.id,
            'variantName', pv."variantName",
            'variant_options', (
              SELECT json_agg(
                json_build_object(
                  'id', vo.id,
                  'optionName', vo."optionName",
                  'weight', vo.weight,
                  'width', vo.width,
                  'length', vo.length,
                  'height', vo.height,
                  'currency', vo.currency,
                  'unitPrice', vo."unitPrice",
                  'originalPrice', vo."originalPrice",
                  'currentPrice', vo."currentPrice"
                )
              )
              FROM variant_options vo
              WHERE vo."variantId" = pv.id
            )
          )
        ) as product_variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv."productId"
      GROUP BY p.id
    `;

    if (!data || data.length === 0) {
      console.warn("No data returned from products query");
      return [];
    }

    // // Type assertion for database response
    const transformedData: ProductsItem[] = (data as DbProduct[]).map(
      (product) => ({
        id: product.id,
        src: product.src,
        alt: product.alt,
        name: product.name,
        description: Array.isArray(product.description)
          ? product.description
          : JSON.parse(product.description || "[]"),
        additionalInfo1: Array.isArray(product.additionalinfo1)
          ? product.additionalinfo1
          : JSON.parse(product.additionalinfo1 || "[]"),
        additionalInfo2: Array.isArray(product.additionalinfo2)
          ? product.additionalinfo2
          : JSON.parse(product.additionalinfo2 || "[]"),
        currency: product.currency,
        status: product.status,
        variants: (product.product_variants || []).map(
          (variant): ProductVariant => ({
            id: variant.id,
            variantName: variant.variantName,
            options: (variant.variant_options || []).map(
              (option): VariantOption => ({
                id: option.id,
                optionName: option.optionName,
                weight: option.weight,
                width: option.width,
                length: option.length,
                height: option.height,
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
  } catch (error) {
    console.error("Error fetching products:", JSON.stringify(error, null, 2));
    throw new Error(
      `Failed to fetch products: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
