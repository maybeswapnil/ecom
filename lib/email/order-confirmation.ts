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
    .select("order_number, email, total_paise, shipping_address")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { sent: false, reason: "Order not found" };

  const { data: items } = await supabase
    .from("order_items")
    .select("title_snapshot, unit_price_paise, qty")
    .eq("order_id", orderId);

  const address = order.shipping_address as {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  } | null;

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
    addressLines: address
      ? [
          `${address.line1}${address.line2 ? `, ${address.line2}` : ""}`,
          `${address.city}, ${address.state} ${address.pincode}`,
        ]
      : [],
  });
}
