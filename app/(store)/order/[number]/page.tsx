import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidReceiptToken } from "@/lib/order-token";
import { OrderStatusView } from "@/components/store/OrderStatusView";

export const metadata = { title: "Order Confirmation" };

export default async function OrderPage({
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
    .select("id, order_number, status, email, subtotal_paise, shipping_paise, total_paise, shipping_address, created_at")
    .eq("order_number", number)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("title_snapshot, sku_snapshot, unit_price_paise, qty, variant_id")
    .eq("order_id", order.id);

  const variantIds = (items ?? []).map((i) => i.variant_id).filter(Boolean);
  const { data: variants } = variantIds.length
    ? await supabase
        .from("product_variants")
        .select("id, size_label, frame_finish")
        .in("id", variantIds)
    : { data: [] };
  const variantById = new Map((variants ?? []).map((v) => [v.id, v]));

  const address = order.shipping_address as {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  } | null;

  return (
    <section className="max-w-[720px] mx-auto px-7 py-20 pb-27.5">
      <OrderStatusView
        orderNumber={order.order_number}
        token={t}
        initialStatus={order.status}
        createdAt={order.created_at}
        email={order.email}
        subtotalPaise={order.subtotal_paise}
        shippingPaise={order.shipping_paise}
        totalPaise={order.total_paise}
        address={address}
        items={(items ?? []).map((i) => {
          const variant = variantById.get(i.variant_id);
          return {
            title: i.title_snapshot,
            sku: i.sku_snapshot,
            qty: i.qty,
            unitPricePaise: i.unit_price_paise,
            sizeLabel: variant?.size_label ?? null,
            finish: variant?.frame_finish ?? null,
          };
        })}
      />
    </section>
  );
}
