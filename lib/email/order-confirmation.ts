import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/money";
import { receiptToken } from "@/lib/order-token";
import { sendOrderConfirmationEmail } from "@/lib/email/send";

type SendResult = { sent: true } | { sent: false; reason: string };

/** Fetches an order's real items/address from the DB and sends the confirmation email —
 *  shared by the webhook's paid-transition effect and the admin's resend action, so both
 *  paths always send the actual order content instead of a placeholder. */
export async function sendOrderConfirmationForOrder(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string
): Promise<SendResult> {
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, email, total_paise, subtotal_paise, shipping_paise, discount_paise, shipping_address, created_at"
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { sent: false, reason: "Order not found" };

  const { data: items } = await supabase
    .from("order_items")
    .select("title_snapshot, sku_snapshot, unit_price_paise, qty")
    .eq("order_id", orderId);

  const address = order.shipping_address as {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  } | null;

  const addressLines = address
    ? [
        `${address.line1}${address.line2 ? `, ${address.line2}` : ""}`,
        `${address.city}, ${address.state} ${address.pincode}`,
      ]
    : [];

  return sendOrderConfirmationEmail({
    orderNumber: order.order_number,
    to: order.email,
    token: receiptToken(order.order_number),
    items: (items ?? []).map((i) => ({
      title: i.title_snapshot,
      qty: i.qty,
      priceLabel: formatPaise(i.unit_price_paise * i.qty),
    })),
    totalLabel: formatPaise(order.total_paise),
    addressLines,
    invoice: {
      orderDate: new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      customerName: order.email,
      items: (items ?? []).map((i) => ({
        title: i.title_snapshot,
        sku: i.sku_snapshot,
        qty: i.qty,
        unitPricePaise: i.unit_price_paise,
      })),
      subtotalPaise: order.subtotal_paise,
      shippingPaise: order.shipping_paise,
      discountPaise: order.discount_paise,
      totalPaise: order.total_paise,
    },
  });
}
