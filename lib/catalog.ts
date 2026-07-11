import { createClient } from "@/lib/supabase/server";
import type { ProductWithVariants } from "@/lib/types";

export async function getLiveProducts(): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "live")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []) as ProductWithVariants[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (error) throw new Error(`Failed to load product ${slug}: ${error.message}`);
  return data as ProductWithVariants | null;
}

const SIZE_ORDER = ["A4", "A3", "A2", "A1", "30x40", "40x50", "50x70"];

export function sortedVariants(product: ProductWithVariants) {
  return [...product.product_variants]
    .filter((v) => v.active)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size_label) - SIZE_ORDER.indexOf(b.size_label));
}

export function distinctSizes(product: ProductWithVariants) {
  const seen = new Map<string, (typeof product.product_variants)[number]>();
  for (const v of sortedVariants(product)) {
    if (!seen.has(v.size_label)) seen.set(v.size_label, v);
  }
  return [...seen.values()];
}

export function distinctFinishes(product: ProductWithVariants, sizeLabel: string) {
  return sortedVariants(product).filter((v) => v.size_label === sizeLabel);
}

export function findVariant(product: ProductWithVariants, sizeLabel: string, finish: string) {
  return product.product_variants.find(
    (v) => v.size_label === sizeLabel && v.frame_finish === finish && v.active
  );
}
