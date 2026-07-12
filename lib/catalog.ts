import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProductWithVariants } from "@/lib/types";

export async function getLiveProducts(): Promise<ProductWithVariants[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "live")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []) as ProductWithVariants[];
}

const FEATURED_MAX = 6;
const FEATURED_FALLBACK_MIN = 3;

/** Home page "From the collection" — admin-picked products (1 to FEATURED_MAX,
 *  in featured_order), topped up with the most recent non-featured live
 *  products only if the admin has picked none at all, so the section is never
 *  empty. Once at least one product is featured, we show exactly that
 *  selection — no silent padding to a fixed count. */
export async function getFeaturedProducts(): Promise<ProductWithVariants[]> {
  const supabase = createPublicClient();

  const { data: featured, error: featuredError } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "live")
    .eq("is_featured", true)
    .order("featured_order", { ascending: true })
    .limit(FEATURED_MAX);

  if (featuredError) throw new Error(`Failed to load featured products: ${featuredError.message}`);

  const picked = (featured ?? []) as ProductWithVariants[];
  if (picked.length > 0) return picked;

  const { data: fallback, error: fallbackError } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(FEATURED_FALLBACK_MIN);

  if (fallbackError) throw new Error(`Failed to load fallback products: ${fallbackError.message}`);

  return (fallback ?? []) as ProductWithVariants[];
}

// cache(): generateMetadata and the page body both call this for the same slug
// within one request — dedupe to a single Supabase round trip.
export const getProductBySlug = cache(
  async (slug: string): Promise<ProductWithVariants | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("slug", slug)
      .eq("status", "live")
      .maybeSingle();

    if (error) throw new Error(`Failed to load product ${slug}: ${error.message}`);
    return data as ProductWithVariants | null;
  }
);

/** Slugs of all live products — used to prerender product pages at build time. */
export async function getLiveSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select("slug").eq("status", "live");

  if (error) throw new Error(`Failed to load product slugs: ${error.message}`);
  return (data ?? []).map((row) => row.slug as string);
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
