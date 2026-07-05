"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendShippingConfirmationEmail,
  sendRefundConfirmationEmail,
  sendDeliveredEmail,
  sendOrderCanceledEmail,
} from "@/lib/email/send";
import { sendOrderConfirmationForOrder } from "@/lib/email/order-confirmation";
import { formatPaise } from "@/lib/money";
import { summarizeItems } from "@/lib/order-summary";

async function historyRow(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  fromStatus: string,
  toStatus: string,
  actorEmail: string,
  note?: string
) {
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: fromStatus,
    to_status: toStatus,
    actor: `admin:${actorEmail}`,
    note,
  });
}

export async function markPacked(orderId: string) {
  const { email } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("status", "paid")
    .maybeSingle();
  if (!order) return { error: "Order is not in a state that can be packed." };

  await supabase.from("orders").update({ status: "packed" }).eq("id", orderId);
  await historyRow(supabase, orderId, "paid", "packed", email);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function markShippedManual(
  orderId: string,
  courier: string,
  awb: string,
  trackingUrl?: string
) {
  const { email } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, order_number, email, emails_sent")
    .eq("id", orderId)
    .in("status", ["paid", "packed"])
    .maybeSingle();
  if (!order) return { error: "Order is not in a state that can be marked shipped." };

  await supabase.from("shipments").insert({
    order_id: orderId,
    courier_name: courier,
    awb,
    label_url: trackingUrl ?? null,
    status: "in_transit",
    active: true,
    shipped_at: new Date().toISOString(),
  });

  await supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
  await historyRow(supabase, orderId, order.status, "shipped", email, `Manual AWB: ${awb}`);

  const emailsSent = (order.emails_sent as Record<string, string>) ?? {};
  if (!emailsSent.shipping) {
    const { data: items } = await supabase
      .from("order_items")
      .select("title_snapshot")
      .eq("order_id", orderId);
    const itemsSummary = summarizeItems(items ?? []);

    const result = await sendShippingConfirmationEmail({
      orderNumber: order.order_number,
      to: order.email,
      courier,
      awb,
      itemsSummary,
      trackingUrl,
    });
    if (result.sent) {
      await supabase
        .from("orders")
        .update({ emails_sent: { ...emailsSent, shipping: new Date().toISOString() } })
        .eq("id", orderId);
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function markDelivered(orderId: string) {
  const { email: actorEmail } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, order_number, email, emails_sent")
    .eq("id", orderId)
    .eq("status", "shipped")
    .maybeSingle();
  if (!order) return { error: "Order is not in a state that can be marked delivered." };

  await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
  await supabase
    .from("shipments")
    .update({ delivered_at: new Date().toISOString(), status: "delivered" })
    .eq("order_id", orderId)
    .eq("active", true);
  await historyRow(supabase, orderId, "shipped", "delivered", actorEmail);

  const emailsSent = (order.emails_sent as Record<string, string>) ?? {};
  if (!emailsSent.delivered) {
    const result = await sendDeliveredEmail({ orderNumber: order.order_number, to: order.email });
    if (result.sent) {
      await supabase
        .from("orders")
        .update({ emails_sent: { ...emailsSent, delivered: new Date().toISOString() } })
        .eq("id", orderId);
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function cancelPendingOrder(orderId: string, reason: string) {
  const { email: actorEmail } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, order_number, email, total_paise, emails_sent")
    .eq("id", orderId)
    .eq("status", "pending")
    .maybeSingle();
  if (!order) return { error: "Order is not pending." };

  await supabase
    .from("orders")
    .update({ status: "cancelled", cancelled_reason: reason })
    .eq("id", orderId);
  await historyRow(supabase, orderId, "pending", "cancelled", actorEmail, reason);

  const emailsSent = (order.emails_sent as Record<string, string>) ?? {};
  if (!emailsSent.cancelled) {
    const { data: items } = await supabase
      .from("order_items")
      .select("title_snapshot")
      .eq("order_id", orderId);

    const result = await sendOrderCanceledEmail({
      orderNumber: order.order_number,
      to: order.email,
      amountLabel: formatPaise(order.total_paise),
      itemsSummary: summarizeItems(items ?? []),
    });
    if (result.sent) {
      await supabase
        .from("orders")
        .update({ emails_sent: { ...emailsSent, cancelled: new Date().toISOString() } })
        .eq("id", orderId);
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function addOrderNote(orderId: string, text: string) {
  await requireAdmin();
  if (text.length > 2000) return { error: "Note is too long." };
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("internal_notes")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Order not found." };

  const stamped = `[${new Date().toISOString()}] ${text}`;
  const updated = order.internal_notes ? `${order.internal_notes}\n${stamped}` : stamped;
  await supabase.from("orders").update({ internal_notes: updated }).eq("id", orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function resendEmail(
  orderId: string,
  kind: "order_confirmation" | "shipping_confirmation" | "refund_confirmation"
) {
  await requireAdmin();
  const supabase = createAdminClient();

  if (kind === "order_confirmation") {
    const result = await sendOrderConfirmationForOrder(supabase, orderId);
    if (!result.sent) return { error: result.reason };
    await stampEmailGuard(supabase, orderId, "order_confirmation");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, email, total_paise")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Order not found." };

  if (kind === "shipping_confirmation") {
    const { data: shipment } = await supabase
      .from("shipments")
      .select("courier_name, awb, label_url")
      .eq("order_id", orderId)
      .eq("active", true)
      .maybeSingle();
    if (!shipment) return { error: "No shipment on file for this order." };

    const { data: items } = await supabase
      .from("order_items")
      .select("title_snapshot")
      .eq("order_id", orderId);

    const result = await sendShippingConfirmationEmail({
      orderNumber: order.order_number,
      to: order.email,
      courier: shipment.courier_name ?? "Courier",
      awb: shipment.awb ?? "",
      itemsSummary: summarizeItems(items ?? []),
      trackingUrl: shipment.label_url ?? undefined,
    });
    if (!result.sent) return { error: result.reason };
    await stampEmailGuard(supabase, orderId, "shipping");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  }

  // refund_confirmation
  const { data: refund } = await supabase
    .from("refunds")
    .select("id, amount_paise")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!refund) return { error: "No refund on file for this order." };

  const { data: refundItems } = await supabase
    .from("order_items")
    .select("title_snapshot")
    .eq("order_id", orderId);

  const result = await sendRefundConfirmationEmail({
    orderNumber: order.order_number,
    to: order.email,
    amountLabel: formatPaise(refund.amount_paise),
    itemsSummary: summarizeItems(refundItems ?? []),
  });
  if (!result.sent) return { error: result.reason };
  await stampEmailGuard(supabase, orderId, `refund_${refund.id}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

async function stampEmailGuard(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  guardKey: string
) {
  const { data: order } = await supabase
    .from("orders")
    .select("emails_sent")
    .eq("id", orderId)
    .maybeSingle();
  const emailsSent = (order?.emails_sent as Record<string, string>) ?? {};
  await supabase
    .from("orders")
    .update({ emails_sent: { ...emailsSent, [guardKey]: new Date().toISOString() } })
    .eq("id", orderId);
}
