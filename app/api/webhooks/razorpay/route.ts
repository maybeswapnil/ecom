import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmationForOrder } from "@/lib/email/order-confirmation";
import {
  sendAdminNewOrderEmail,
  sendRefundConfirmationEmail,
  sendPaymentFailedEmail,
} from "@/lib/email/send";
import { formatPaise } from "@/lib/money";
import { summarizeItems } from "@/lib/order-summary";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  entity: string;
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; amount?: number; error_code?: string; error_description?: string } };
    order?: { entity: { id: string } };
    refund?: { entity: { id: string; payment_id: string; amount: number } };
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  // Razorpay's dedup identifier is this header, not a field in the JSON body.
  const eventId = req.headers.get("x-razorpay-event-id");

  if (!signature) {
    return NextResponse.json({ error: { code: "SIGNATURE_INVALID" } }, { status: 401 });
  }
  if (!eventId) {
    return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: "Missing event id" } }, { status: 400 });
  }

  let valid: boolean;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch {
    // Webhook secret not configured yet — reject rather than silently accepting unverified events.
    return NextResponse.json({ error: { code: "INTERNAL", message: "Webhook not configured" } }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: { code: "SIGNATURE_INVALID" } }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const supabase = createAdminClient();

  // Dedupe — Razorpay retries deliveries for up to ~24h.
  const { error: insertError } = await supabase
    .from("webhook_events")
    .insert({ id: eventId, payload: event });
  if (insertError) {
    if (insertError.code === "23505") {
      // Unique violation on the primary key: already processed.
      return NextResponse.json({ ok: true });
    }
    // Any other DB error: fail loudly so Razorpay retries instead of us silently dropping it.
    return NextResponse.json({ error: { code: "INTERNAL", message: "Failed to record webhook event" } }, { status: 500 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    await handlePaidTransition(supabase, event);
  } else if (event.event === "payment.failed") {
    await handlePaymentFailed(supabase, event);
  } else if (event.event === "refund.processed") {
    await handleRefundProcessed(supabase, event);
  }
  // payment.authorized and anything else: log only (already inserted into webhook_events above).

  return NextResponse.json({ ok: true });
}

async function handlePaidTransition(
  supabase: ReturnType<typeof createAdminClient>,
  event: RazorpayWebhookPayload
) {
  const orderId = event.payload.payment?.entity.order_id ?? event.payload.order?.entity.id;
  const paymentId = event.payload.payment?.entity.id;
  if (!orderId) return;

  // Guard against under/overpayment: Razorpay normally enforces payment amount == order amount,
  // but if partial payments are ever enabled on the account a mismatched capture must not mark
  // the order fully paid. Leave it pending and flag for manual review.
  const paidAmount = event.payload.payment?.entity.amount;
  if (paidAmount !== undefined) {
    const { data: target } = await supabase
      .from("orders")
      .select("id, total_paise, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (target?.status === "pending" && paidAmount !== target.total_paise) {
      await supabase.from("orders").update({ amount_mismatch: true }).eq("id", target.id);
      return;
    }
  }

  const { data: updated } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), razorpay_payment_id: paymentId })
    .eq("razorpay_order_id", orderId)
    .eq("status", "pending")
    .select("id, order_number, email")
    .maybeSingle();

  if (!updated) {
    // 0 rows: either already paid (duplicate delivery) or paid-after-cancel.
    const { data: existing } = await supabase
      .from("orders")
      .select("id, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (existing?.status === "cancelled") {
      await supabase.from("orders").update({ paid_after_cancel: true }).eq("id", existing.id);
    }
    return;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, qty")
    .eq("order_id", updated.id);

  for (const item of items ?? []) {
    // Atomic guarded decrement (013_payment_hardening.sql) — returns null when stock is short.
    const { data: decremented } = await supabase.rpc("decrement_stock", {
      p_variant_id: item.variant_id,
      p_qty: item.qty,
    });
    if (!decremented) {
      await supabase.from("orders").update({ oversold: true }).eq("id", updated.id);
    }
  }

  await runPaidEffects(supabase, updated.id);

  await supabase.from("order_status_history").insert({
    order_id: updated.id,
    from_status: "pending",
    to_status: "paid",
    actor: "webhook",
  });
}

/** Each effect is individually guarded by a key in orders.emails_sent/effects so retries can't
 *  double-fire. A missing RESEND_API_KEY makes sendX() return {sent:false} — that's expected
 *  pre-launch and simply leaves the guard unset for the admin retry button to pick up later. */
async function runPaidEffects(supabase: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, total_paise, shipping_address, emails_sent")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  let emailsSent = (order.emails_sent as Record<string, string>) ?? {};
  const address = order.shipping_address as { city?: string } | null;

  if (!emailsSent.order_confirmation) {
    const result = await sendOrderConfirmationForOrder(supabase, orderId);
    if (result.sent) {
      emailsSent = { ...emailsSent, order_confirmation: new Date().toISOString() };
      await supabase.from("orders").update({ emails_sent: emailsSent }).eq("id", orderId);
    }
  }

  if (!emailsSent.admin_new) {
    const result = await sendAdminNewOrderEmail({
      orderNumber: order.order_number,
      orderId,
      totalLabel: formatPaise(order.total_paise),
      city: address?.city ?? "—",
    });
    if (result.sent) {
      emailsSent = { ...emailsSent, admin_new: new Date().toISOString() };
      await supabase.from("orders").update({ emails_sent: emailsSent }).eq("id", orderId);
    }
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  event: RazorpayWebhookPayload
) {
  const payment = event.payload.payment?.entity;
  if (!payment) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, email, total_paise, payment_attempts, emails_sent, status")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!order) return;

  const attempts = Array.isArray(order.payment_attempts) ? order.payment_attempts : [];
  attempts.push({
    payment_id: payment.id,
    code: payment.error_code,
    description: payment.error_description,
    at: new Date().toISOString(),
  });
  await supabase.from("orders").update({ payment_attempts: attempts }).eq("id", order.id);

  // Only the pending state means the customer hasn't paid elsewhere/retried successfully yet —
  // send once per order, not once per failed attempt, to avoid spamming repeated retries.
  const emailsSent = (order.emails_sent as Record<string, string>) ?? {};
  if (order.status === "pending" && !emailsSent.payment_failed) {
    const { data: items } = await supabase
      .from("order_items")
      .select("title_snapshot")
      .eq("order_id", order.id);

    const result = await sendPaymentFailedEmail({
      orderNumber: order.order_number,
      to: order.email,
      amountLabel: formatPaise(order.total_paise),
      itemsSummary: summarizeItems(items ?? []),
      reason: payment.error_description ?? undefined,
      checkoutUrl: `${SITE_URL}/cart`,
    });
    if (result.sent) {
      await supabase
        .from("orders")
        .update({ emails_sent: { ...emailsSent, payment_failed: new Date().toISOString() } })
        .eq("id", order.id);
    }
  }
}

async function handleRefundProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  event: RazorpayWebhookPayload
) {
  const refund = event.payload.refund?.entity;
  if (!refund) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, email, total_paise, emails_sent")
    .eq("razorpay_payment_id", refund.payment_id)
    .maybeSingle();
  if (!order) return;

  const { error: refundInsertError } = await supabase.from("refunds").insert({
    order_id: order.id,
    razorpay_refund_id: refund.id,
    amount_paise: refund.amount,
  });
  // Unique violation on razorpay_refund_id: this refund event was already recorded — stop here
  // so a webhook retry can't send the refund email twice.
  if (refundInsertError) return;

  const { data: refunds } = await supabase
    .from("refunds")
    .select("amount_paise")
    .eq("order_id", order.id);
  const cumulative = (refunds ?? []).reduce((sum, r) => sum + r.amount_paise, 0);

  if (cumulative >= order.total_paise) {
    await supabase.from("orders").update({ status: "refunded" }).eq("id", order.id);
  } else {
    await supabase.from("orders").update({ partially_refunded: true }).eq("id", order.id);
  }

  const guardKey = `refund_${refund.id}`;
  const emailsSent = (order.emails_sent as Record<string, string>) ?? {};
  if (!emailsSent[guardKey]) {
    const { data: items } = await supabase
      .from("order_items")
      .select("title_snapshot")
      .eq("order_id", order.id);

    const result = await sendRefundConfirmationEmail({
      orderNumber: order.order_number,
      to: order.email,
      amountLabel: formatPaise(refund.amount),
      itemsSummary: summarizeItems(items ?? []),
    });
    if (result.sent) {
      await supabase
        .from("orders")
        .update({ emails_sent: { ...emailsSent, [guardKey]: new Date().toISOString() } })
        .eq("id", order.id);
    }
  }
}
