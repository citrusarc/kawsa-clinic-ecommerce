import { supabase } from "@/utils/supabase/client";
import { ProductsItem } from "@/types";

export async function getProducts(): Promise<ProductsItem[]> {
  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data as ProductsItem[];
}
