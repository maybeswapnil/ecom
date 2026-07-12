import { createClient } from "@/lib/supabase/server";
import type { ProductReview } from "@/lib/types";

export async function getApprovedReviews(productId: string): Promise<ProductReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  return (data ?? []) as ProductReview[];
}

export function aggregateRating(reviews: ProductReview[]): { average: number; count: number } | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, r) => total + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}
