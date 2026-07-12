import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidReceiptToken } from "@/lib/order-token";
import { ReviewForm } from "@/components/store/ReviewForm";

export const metadata = { title: "Rate your prints", robots: { index: false } };

export default async function OrderReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { number } = await params;
  const { t } = await searchParams;

  if (!t || !isValidReceiptToken(number, t)) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("order_number", number)
    .maybeSingle();

  if (!order) notFound();
  if (order.status !== "delivered") {
    return (
      <section className="max-w-[560px] mx-auto px-7 py-24 text-center">
        <h1 className="font-display text-2xl font-medium mb-3">Not delivered yet</h1>
        <p className="text-muted text-[15px]">
          You can rate your prints once order {order.order_number} has been delivered.
        </p>
      </section>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("title_snapshot, product_variants(product_id)")
    .eq("order_id", order.id);

  const seen = new Set<string>();
  const products: { productId: string; title: string }[] = [];
  for (const item of items ?? []) {
    const productId = (item.product_variants as unknown as { product_id: string } | null)
      ?.product_id;
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);
    products.push({ productId, title: item.title_snapshot });
  }

  const { data: existingReviews } = await supabase
    .from("product_reviews")
    .select("product_id, rating, body, reviewer_name")
    .eq("order_id", order.id);

  const reviewByProduct = new Map((existingReviews ?? []).map((r) => [r.product_id, r]));

  return (
    <section className="max-w-[560px] mx-auto px-7 py-20 pb-27.5">
      <h1 className="font-display text-3xl font-medium mb-2.5">Rate your prints</h1>
      <p className="text-muted text-[15px] mb-10">
        Order {order.order_number}. Reviews are checked before they go live.
      </p>
      <div className="flex flex-col gap-9">
        {products.map((p) => (
          <ReviewForm
            key={p.productId}
            orderNumber={order.order_number}
            token={t}
            productId={p.productId}
            title={p.title}
            existing={reviewByProduct.get(p.productId) ?? null}
          />
        ))}
        {products.length === 0 && (
          <p className="text-muted text-[14px]">No products found on this order.</p>
        )}
      </div>
    </section>
  );
}
