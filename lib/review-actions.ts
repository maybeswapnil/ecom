"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isValidReceiptToken } from "@/lib/order-token";
import { checkRateLimit } from "@/lib/rate-limit";
import { reviewSubmitSchema } from "@/lib/validation";

export async function submitReview(
  orderNumber: string,
  token: string,
  input: { productId: string; rating: number; body: string; reviewerName: string }
) {
  if (!isValidReceiptToken(orderNumber, token)) {
    return { error: "This review link is invalid or has expired." };
  }

  const parsed = reviewSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }

  const withinLimit = await checkRateLimit(`review_submit:${orderNumber}`, 10, 3600);
  if (!withinLimit) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) return { error: "Order not found." };
  if (order.status !== "delivered") {
    return { error: "Reviews can only be left once your order has been delivered." };
  }

  // Confirm the product was actually part of this order — join through order_items -> variants.
  const { data: matchingItem } = await supabase
    .from("order_items")
    .select("id, variant_id, product_variants!inner(product_id)")
    .eq("order_id", order.id)
    .eq("product_variants.product_id", parsed.data.productId)
    .limit(1)
    .maybeSingle();

  if (!matchingItem) {
    return { error: "This product wasn't part of that order." };
  }

  const { error } = await supabase.from("product_reviews").upsert(
    {
      product_id: parsed.data.productId,
      order_id: order.id,
      rating: parsed.data.rating,
      body: parsed.data.body || null,
      reviewer_name: parsed.data.reviewerName,
      status: "pending",
    },
    { onConflict: "order_id,product_id" }
  );

  if (error) return { error: error.message };
  return { ok: true };
}
