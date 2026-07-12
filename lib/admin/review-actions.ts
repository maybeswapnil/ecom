"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setReviewStatus(reviewId: string, status: "approved" | "rejected") {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: review } = await supabase
    .from("product_reviews")
    .select("product_id, products(slug)")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return { error: "Review not found." };

  const { error } = await supabase.from("product_reviews").update({ status }).eq("id", reviewId);
  if (error) return { error: error.message };

  // The product page is statically cached and renders approved reviews.
  const slug = (review.products as unknown as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/prints/${slug}`);
  revalidatePath("/admin/reviews");
  return { ok: true };
}
